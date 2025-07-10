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

import argon2 from "argon2";
import jwt from "jsonwebtoken";
import Config from "@/lib/constant";
import {
  closeAllConnections,
  getRedisConnection,
} from "@/lib/database/connection";
import { MiscSchema, type User, UserSchema } from "@/lib/database/schema";
import { CryptoManager } from "@/lib/operations/encryption";
import { log } from "@/lib/operations/logs";

export interface JwtPayload {
  username: string;

  ip?: string;
  buildId?: string;
  checksum?: string;

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
      sign: await hashString(`${data.buildId}×${Config.CIPHER_ALGORITHM}`),
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
      alg: `${Config.CIPHER_ALGORITHM}×${Config.CIPHER_ENCODING}`,
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
  const tokenTTL = Config.SESSION_DURATION * 60;

  const gen = jwt.sign(
    {
      ...opt,
      checksum: await generateChecksum({
        ip,
        buildId: process.env.BUILD_ID,
        ...opt,
      }),
    },
    Config.JWT_SECRET,
    {
      algorithm: Config.JWT_ALGORITHM,
      expiresIn: tokenTTL,
      header: {
        alg: Config.JWT_ALGORITHM,
      },
      issuer: Config.JWT_ISSUER,
      subject: Config.DOMAIN,
    }
  );

  const redis = await getRedisConnection();
  await redis.set(await hashString(user.username), gen, {
    EX: tokenTTL,
  });
  return gen;
}

export async function verify(
  token: string,
  ip: string
): Promise<null | JwtPayload> {
  try {
    const verification: JwtPayload = jwt.verify(token, Config.JWT_SECRET, {
      algorithms: [Config.JWT_ALGORITHM],
      issuer: Config.JWT_ISSUER,
      subject: Config.DOMAIN,
    }) as JwtPayload;
    if (!verification) return null;

    if (
      verification.iss !== Config.JWT_ISSUER ||
      verification.sub !== Config.DOMAIN ||
      !(await verifyChecksum(
        { ip, buildId: process.env.BUILD_ID, ...verification },
        verification?.checksum || ""
      ))
    )
      return null;

    const signed = new Date((verification.iat as number) * 1000 || "");

    if (Date.now() - signed.valueOf() > 60000 * Config.SESSION_DURATION)
      return null;

    const user = await UserSchema.findOne({
      username: verification.username,
    });
    if (!user) return null;

    const redis = await getRedisConnection();
    if ((await redis.get(await hashString(user.username))) !== token)
      return null;

    if (new Date(user.lastPasswordChange).valueOf() > signed.valueOf())
      return null;

    return {
      ip: verification.ip,
      username: verification.username,
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
  const redis = await getRedisConnection();
  const checksum = await redis.get((user._id || "").toString());

  const check = await argon2.verify(
    user.password || "",
    await hashString(password)
  );
  const force = await argon2.verify(
    user.blockPassword || "",
    await hashString(password)
  );
  const verify = await verifyDBChecksum(
    user.username,
    user.password || "",
    user.blockPassword || "",
    getDate(user.lastPasswordChange),
    user.checksum || ""
  );

  if (force || !verify || checksum !== user.checksum) {
    if (force && argon2.needsRehash(user.blockPassword || ""))
      await changeLockPassword(
        await hashString(username.toLowerCase()),
        password,
        password,
        ip
      );

    await new MiscSchema({
      blocked: true,
    }).save();
    await closeAllConnections();
    CryptoManager.shutdown();
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

  if (argon2.needsRehash(user.password || ""))
    await changePassword(
      await hashString(username.toLowerCase()),
      password,
      password,
      ip
    );

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
  const redis = await getRedisConnection();
  await redis.del(await hashString(verification.username));
  CryptoManager.shutdown();
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

  const redis = await getRedisConnection();
  const password = Math.floor(Math.random() * 1e12).toString();
  const pass = await argon2.hash(await hashString(password));
  const blockPassword = Math.floor(Math.random() * 1e12).toString();
  const blockPass = await argon2.hash(await hashString(blockPassword));

  const date = new Date();
  const checksum = await generateDBChecksum(
    username.toLowerCase(),
    pass,
    blockPass,
    getDate(date)
  );

  const newUser = await new UserSchema({
    username: await hashString(username.toLowerCase()),
    password: pass,
    blockPassword: blockPass,
    name,
    lastPasswordChange: getDate(),
    checksum,
  }).save();

  await redis.set(newUser._id.toString(), checksum);
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
  const check = await argon2.verify(
    user.password || "",
    await hashString(oldpassword)
  );
  if (!check) return null;

  const redis = await getRedisConnection();
  const pass = await argon2.hash(await hashString(newpassword));
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

  await redis.set(user._id.toString(), checksum);
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
): Promise<string | null> {
  if (newpassword.length < 8) return null;
  const user = await UserSchema.findOne({
    username: username,
  });
  if (!user) return null;
  const check = await argon2.verify(
    user.blockPassword || "",
    await hashString(oldpassword)
  );
  if (!check) return null;

  const redis = await getRedisConnection();
  const pass = await argon2.hash(await hashString(newpassword));
  const date = new Date();
  const checksum = await generateDBChecksum(
    username,
    user.password || "",
    pass,
    getDate(date)
  );

  await redis.set(user._id.toString(), checksum);
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

  return await token({ user, ip });
}

export async function getAllUsers(): Promise<User[]> {
  return await UserSchema.find().select("-password -checksum -blockPassword");
}

export async function deleteUser(username: string): Promise<boolean> {
  const user = await UserSchema.findOne({
    username: await hashString(username.toLowerCase()),
  });
  if (!user) return false;

  const redis = await getRedisConnection();
  await redis.del(user._id.toString());
  return Boolean(await UserSchema.findByIdAndDelete(user._id));
}
