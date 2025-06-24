/*
 realm.rd, Scribble the plans, spill the thoughts.
 Copyright (C) 2025 Jayant Hegde Kageri <https://github.com/jayantkageri/>

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as
 published by the Free Software Foundation, either version 3 of the
 License, or any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Config from "@/lib/constant";
import { closeAllConnections } from "@/lib/database/connection";
import {
  MiscSchema,
  TokenSchema,
  type User,
  UserSchema,
} from "@/lib/database/schema";
import { log } from "@/lib/operations/logs";

export interface JwtPayload {
  username: string;

  ip?: string;
  buildId?: string;

  iss?: string;
  sub?: string;
  iat?: number;
}

export function getDate(date?: Date) {
  const now = date || new Date();
  const datePart = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const timePart = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(now);

  const ms = now.getMilliseconds().toString().padStart(3, "0");
  return `${datePart}T${timePart}.${ms}+05:30`;
}

export const hashString = async (str: string): Promise<string> => {
  const encoder = new TextEncoder();
  const payload = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", payload);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return hashHex;
};

const generateChecksum = async (data: JwtPayload): Promise<string> =>
  await hashString(
    JSON.stringify({
      key: `${Config.TG_CHAT_ID}*${data.buildId}+${Config.CIPHER_ALGORITHM}`,
      domain: Config.DOMAIN,
      username: data.username,
      ip: data.ip,
      buildId: data.buildId,
      iss: Config.JWT_ISSUER,
    })
  );

const generateDBChecksum = async (
  username: string,
  password: string,
  blockPassword: string,
  lastPasswordChange: string
): Promise<string> =>
  await hashString(
    JSON.stringify({
      username,
      password,
      blockPassword,
      lastPasswordChange,
      alg: Config.SALT_ROUNDS,
    })
  );

const verifyChecksum = async (
  data: JwtPayload,
  checksum: string
): Promise<boolean> => checksum === (await generateChecksum(data));

const verifyDBChecksum = async (
  username: string,
  password: string,
  blockPassword: string,
  lastPasswordChange: string,
  checksum: string
): Promise<boolean> =>
  checksum ===
  (await generateDBChecksum(
    username,
    password,
    blockPassword,
    lastPasswordChange
  ));

async function token({
  user,
  ip,
}: {
  user: User;
  ip: string;
}): Promise<string> {
  const opt: JwtPayload = {
    username: user.username,
  };

  const gen = jwt.sign(opt, Config.JWT_SECRET, {
    algorithm: Config.JWT_ALGORITHM,
    expiresIn: Config.SESSION_DURATION * 60,
    header: {
      alg: Config.JWT_ALGORITHM,
      ...{
        checksum: await generateChecksum({
          ip,
          buildId: process.env.BUILD_ID,
          ...opt,
        }),
      },
    },
    issuer: Config.JWT_ISSUER,
    subject: Config.DOMAIN,
  });

  await TokenSchema.findOneAndDelete({ username: user.username });
  const db = await new TokenSchema({
    username: user.username,
    token: gen,
  }).save();

  return db.token;
}

export async function verify(
  token: string,
  ip: string
): Promise<null | JwtPayload> {
  try {
    const verification = jwt.verify(token, Config.JWT_SECRET);
    if (!verification) return null;

    const {
      header,
      payload,
    }: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      header: any;
      payload: JwtPayload;
    } = (() => {
      const decoded = jwt.decode(token, {
        complete: true,
      }) as unknown as {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        header: any;
        payload: JwtPayload;
      } | null;
      if (!decoded) return { header: undefined, payload: {} as JwtPayload };
      return decoded;
    })();

    if (
      payload.iss !== Config.JWT_ISSUER ||
      payload.sub !== Config.DOMAIN ||
      header?.alg !== Config.JWT_ALGORITHM ||
      !(await verifyChecksum(
        { ip, buildId: process.env.BUILD_ID, ...payload },
        header?.checksum
      ))
    )
      return null;

    const signed = new Date((payload.iat as number) * 1000 || ""); // get signed date

    if (Date.now() - signed.valueOf() > 60000 * Config.SESSION_DURATION)
      return null;

    const user = await UserSchema.findOne({
      username: payload.username,
    });
    if (!user) return null;

    if (
      !(await TokenSchema.findOne({
        token,
        username: payload.username,
      }))
    )
      return null;

    if (new Date(user.lastPasswordChange).valueOf() > signed.valueOf())
      return null;

    return {
      ip: payload.ip,
      username: payload.username,
    };
  } catch {
    return null;
  }
}

export async function login(
  username: string,
  password: string,
  ip: string
): Promise<null | "locked" | string> {
  const user: User | null = await UserSchema.findOne({
    username: await hashString(username.toLowerCase()),
  });
  if (!user) return null;

  const check = await bcrypt.compare(password, user.password || "");
  const force = await bcrypt.compare(password, user.blockPassword || "");
  const verify = await verifyDBChecksum(
    user.username,
    user.password || "",
    user.blockPassword || "",
    getDate(user.lastPasswordChange),
    user.checksum || ""
  );

  if (force || !verify) {
    await new MiscSchema({
      blocked: true,
    }).save();
    await closeAllConnections();
    await log(
      "lock",
      `The application has been locked as per the request of the user  __**${username.toLowerCase()} via ${
        force ? "the lock password" : "the database checksum mismatch"
      } **__`,
      ip,
      new Date()
    );
    return "locked";
  }
  if (!check) return null;

  const genToken = await token({ user, ip });
  await log(
    "login",
    `The user ${username.toLowerCase()} has signed in to the application`,
    ip,
    new Date()
  );

  return genToken;
}

export async function logout(
  token: string,
  ip: string
): Promise<boolean | null> {
  const verification = await verify(token, ip);
  if (!verification) return null;
  await TokenSchema.findOneAndDelete({ token });
  return true;
}

export async function register(
  username: string,
  name: string
): Promise<null | {
  user: {
    username: string;
    timestamp?: Date;
  };
}> {
  if (
    await UserSchema.findOne({
      username: await hashString(username.toLowerCase()),
    })
  )
    return null;

  const password = Math.floor(Math.random() * 1e12).toString();
  const pass = await bcrypt.hash(
    password,
    await bcrypt.genSalt(Config.SALT_ROUNDS)
  );
  const blockPassword = Math.floor(Math.random() * 1e12).toString();
  const blockPass = await bcrypt.hash(
    blockPassword,
    await bcrypt.genSalt(Config.SALT_ROUNDS)
  );

  const date = new Date();
  const checksum = await generateDBChecksum(
    username.toLowerCase(),
    pass,
    blockPass,
    getDate(date)
  );

  const newUser = await new UserSchema({
    username: (await hashString(username.toLowerCase())).toLowerCase(),
    password: pass,
    blockPassword: blockPass,
    name,
    lastPasswordChange: getDate(),
    checksum,
  }).save();

  return {
    user: {
      username: username.toLowerCase(),
      timestamp: newUser.timestamp,
    },
  };
}

export async function changePassword(
  username: string,
  oldpassword: string,
  newpassword: string,
  ip: string
): Promise<string | null> {
  if (newpassword.length < 8) return null;
  let user = await UserSchema.findOne({
    username: username.toLowerCase(),
  });
  if (!user) return null;
  const check = await bcrypt.compare(oldpassword, user.password || "");
  if (!check) return null;
  const pass = await bcrypt.hash(
    newpassword,
    await bcrypt.genSalt(Config.SALT_ROUNDS)
  );
  const date = new Date();
  const checksum = await generateDBChecksum(
    username.toLowerCase(),
    pass,
    user.blockPassword || "",
    getDate(date)
  );

  await log(
    "password",
    `The user ${username.toLowerCase()} has changed the __**login password**__`,
    ip,
    date
  );

  user = await UserSchema.findByIdAndUpdate(user._id, {
    password: pass,
    lastPasswordChange: getDate(date),
    checksum,
  });

  return await token({ user, ip });
}

export async function changeLockPassword(
  username: string,
  oldpassword: string,
  newpassword: string,
  ip: string
): Promise<boolean | null> {
  if (newpassword.length < 8) return null;
  const user = await UserSchema.findOne({
    username: username.toLowerCase(),
  });
  if (!user) return null;
  const check = await bcrypt.compare(oldpassword, user.blockPassword || "");
  if (!check) return null;
  const pass = await bcrypt.hash(
    newpassword,
    await bcrypt.genSalt(Config.SALT_ROUNDS)
  );
  const date = new Date();
  const checksum = await generateDBChecksum(
    username.toLowerCase(),
    user.password || "",
    pass,
    getDate(date)
  );

  await UserSchema.findByIdAndUpdate(user._id, {
    blockPassword: pass,
    lastPasswordChange: getDate(date),
    checksum,
  });

  await log(
    "password",
    `The user ${username.toLowerCase()} has changed the __**application lock password**__`,
    ip,
    new Date()
  );

  return true;
}

export async function getAllUsers(): Promise<User[]> {
  return await UserSchema.find().select("-password");
}

export async function deleteUser(username: string): Promise<boolean> {
  if (
    !(await UserSchema.findOne({
      username: await hashString(username.toLowerCase()),
    }))
  )
    return false;
  return Boolean(
    await UserSchema.findOneAndDelete({
      username: await hashString(username.toLowerCase()),
    })
  );
}
