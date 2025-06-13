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

import { type Algorithm } from "jsonwebtoken";

const DEVELOPMENT = process.env.NODE_ENV !== "production";

/** @description Refer README.md */
export default class Config {
  public static readonly DOMAIN: string = DEVELOPMENT
    ? process.env.NEXT_PUBLIC_DEV_SERVER || "http://localhost:3000"
    : process.env.NEXT_PUBLIC_DOMAIN || "http://localhost:3000"; // No trailing slash

  public static readonly SALT_ROUNDS: number = 12;

  public static readonly JWT_SECRET: string = Buffer.from(
    `${process.env.BUILD_ID}_${process.env.JWT_SECRET || "JWT_SECRET"}`
  ).toString("base64");

  public static readonly JWT_ALGORITHM: Algorithm = "HS512";
  public static readonly JWT_ISSUER: string = "https://jayantkageri.in";

  public static readonly SESSION_DURATION: number = parseInt(
    process.env.SESSION_DURATION || "15"
  );

  public static readonly CIPHER_ALGORITHM: string = "aes-256-cbc";
  public static readonly CIPHER_KEY_SIZE: number = 32;
  public static readonly CIPHER_IV_SIZE: number = 16;
  public static readonly CIPHER_ENCODING: BufferEncoding = "hex";

  public static readonly MONGODB_URI: string =
    process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/";

  public static readonly TG_BOT_TOKEN: string = process.env.TG_BOT_TOKEN || "";
  public static readonly TG_CHAT_ID: string = process.env.TG_CHAT_ID || "";
}
