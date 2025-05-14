import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Config from "@/lib/constant";
import { type User, UserSchema } from "@/lib/database/schema";

export interface JwtPayload {
  username: string;
  name: string;
  signed: string;

  ip: string;
  agent?: string;
  buildId?: string;
  checksum?: string;

  iss?: string;
  sub?: string;
}

export interface JwtToken {
  username: string;
  timestamp: Date;
}

const generateChecksum = (data: JwtPayload) =>
  crypto
    .createHash("md5")
    .update(
      JSON.stringify({
        domain: Config.DOMAIN,
        username: data.username,
        name: data.name,
        signed: data.signed,
        ip: data.ip,
        buildId: data.buildId,
        iss: Config.JWT_ISSUER,
      })
    )
    .digest("hex");

const verifyChecksum = (data: JwtPayload, checksum: string) =>
  checksum === generateChecksum(data);

async function token({
  user,
  ip,
}: {
  user: User;
  ip: string;
}): Promise<string> {
  const opt: JwtPayload = {
    ip,
    username: user.username,
    name: user.name,
    signed: new Date().toISOString(),
    buildId: process.env.BUILD_ID,
  };

  return jwt.sign(opt, Config.JWT_SECRET, {
    algorithm: Config.JWT_ALGORITHM,
    expiresIn: Config.SESSION_DURATION * 86400,
    header: {
      alg: Config.JWT_ALGORITHM,
      ...{
        checksum: generateChecksum(opt),
      },
    },
    issuer: Config.JWT_ISSUER,
    subject: Config.DOMAIN,
  });
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
    } = jwt.decode(token, {
      complete: true,
    })! as unknown as {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      header: any;
      payload: JwtPayload;
    };

    if (
      payload.ip !== ip ||
      payload.iss !== Config.JWT_ISSUER ||
      payload.sub !== Config.DOMAIN ||
      header?.alg !== Config.JWT_ALGORITHM ||
      !verifyChecksum(payload, header?.checksum)
    )
      return null;

    const signed = new Date(payload.signed); // get signed date
    if (
      new Date().valueOf() - signed.valueOf() >
      86400000 * Config.SESSION_DURATION
    )
      return null;

    const user = await UserSchema.findOne({
      username: payload.username,
    });
    if (!user) return null;

    if (new Date(user.lastPasswordChange).valueOf() > signed.valueOf())
      return null;

    return {
      ip: payload.ip,
      name: payload.name,
      username: payload.username,
      signed: payload.signed,
    };
  } catch {
    return null;
  }
}

export async function login(
  username: string,
  password: string,
  ip: string
): Promise<null | {
  token: string;
  user: {
    name: string;
    username: string;
    timestamp?: Date;
  };
}> {
  const user: User | null = await UserSchema.findOne({
    username: username.toLowerCase(),
  });
  if (!user) return null;

  const check = await bcrypt.compare(password, user.password || "");
  if (!check) return null;

  const genToken = await token({ user, ip });

  return {
    token: genToken,
    user: {
      name: user.name,
      username: user.username,
      timestamp: user.timestamp,
    },
  };
}

export async function register(
  username: string,
  name: string
): Promise<
  | string
  | null
  | {
      user: {
        name: string;
        username: string;
        timestamp?: Date;
      };
    }
> {
  if (await UserSchema.findOne({ username: username.toLowerCase() }))
    return "User alredy exists";

  const password = Math.floor(Math.random() * 1e12).toString();
  const pass = await bcrypt.hash(
    password,
    await bcrypt.genSalt(Config.SALT_ROUNDS)
  );

  const newUser = await new UserSchema({
    username: username.toLowerCase(),
    password: pass,
    name,
    lastPasswordChange: new Date(),
  }).save();

  console.log(username, password);
  return {
    user: {
      name: newUser.name,
      username: newUser.username,
      timestamp: newUser.timestamp,
    },
  };
}

export async function changePassword(
  username: string,
  oldpassword: string,
  newpassword: string,
  ip: string
): Promise<
  | string
  | null
  | {
      token: string;
      user: {
        name: string;
        username: string;
        timestamp?: Date;
      };
    }
> {
  if (newpassword.length < 8) return "Invalid New Password (minimum length 8)";
  let user = await UserSchema.findOne({
    username: username.toLowerCase(),
  });
  if (!user) return "Invalid Credentials";
  const check = await bcrypt.compare(oldpassword, user.password || "");
  if (!check) return "Invalid Credentials";
  const pass = await bcrypt.hash(
    newpassword,
    await bcrypt.genSalt(Config.SALT_ROUNDS)
  );

  user = await UserSchema.findOneAndUpdate(
    { username: username.toLowerCase() },
    {
      password: pass,
      lastPasswordChange: new Date(),
    }
  );

  return {
    token: await token({ user, ip }),
    user: {
      name: user.name,
      username: user.username,
      timestamp: user.timestamp,
    },
  };
}

export async function getAllUsers(): Promise<User[]> {
  return await UserSchema.find().select("-password");
}

export async function deleteUser(username: string): Promise<boolean> {
  if (!(await UserSchema.findOne({ username: username.toLowerCase() })))
    return false;
  return Boolean(
    await UserSchema.findOneAndDelete({ username: username.toLowerCase() })
  );
}
