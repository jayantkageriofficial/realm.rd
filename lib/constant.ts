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

import type { Algorithm } from "jsonwebtoken";

const DEVELOPMENT = process.env.NODE_ENV !== "production";

/** @description Refer README.md */
const Config = {
  DOMAIN: DEVELOPMENT
    ? process.env.NEXT_PUBLIC_DEV_SERVER || "http://localhost:3000"
    : process.env.NEXT_PUBLIC_DOMAIN || "http://localhost:3000", // No trailing slash

  JWT_SECRET: Buffer.from(
    `${process.env.BUILD_ID}_${process.env.JWT_SECRET || "JWT_SECRET"}`
  ).toString("base64"),

  JWT_ALGORITHM: "HS512" as Algorithm,
  JWT_ISSUER: "https://jayantkageri.in",

  SESSION_DURATION: parseInt(process.env.SESSION_DURATION || "15"),

  CIPHER_ALGORITHM: "aes-256-cbc",
  CIPHER_KEY_SIZE: 32,
  CIPHER_IV_SIZE: 16,
  CIPHER_ENCODING: "hex" as BufferEncoding,

  MONGODB_URI: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/",
  REDIS_URI: process.env.REDIS_URI || "redis://127.0.1:6379",

  TG_BOT_TOKEN: process.env.TG_BOT_TOKEN || "",
  TG_CHAT_ID: process.env.TG_CHAT_ID || "",
};

export default Config;
