/*
 realm.rd, Scribble the plans, spill the thoughts.
 Copyright (C) 2025 Jayant Hegde Kageri <https://jayantkageri.in/>

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

import Config from "@/lib/constant";
import { type JwtPayload } from "@/lib/operations/auth";

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

export const generateJWTChecksum = async (data: JwtPayload): Promise<string> =>
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

export const generateDBChecksum = async (
  username: string,
  password: string,
  blockPassword: string,
  lastPasswordChange: string
): Promise<string> =>
  await hashString(
    `${username},${password},${blockPassword},${lastPasswordChange},${Config.CIPHER_ALGORITHM}×${Config.CIPHER_ENCODING}`
  );

export const verifyJWTChecksum = async (
  data: JwtPayload,
  checksum: string
): Promise<boolean> => checksum === (await generateJWTChecksum(data));

export const verifyDBChecksum = async (
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

export const generateContentChecksum = async (
  id: string,
  title: string,
  content: string,
  timestamp: Date,
  username: string
): Promise<string> =>
  await hashString(`${id},${title},${content},${timestamp}×${username}`);

export const verifyContentChecksum = async (
  checksum: string,
  id: string,
  title: string,
  content: string,
  timestamp: Date,
  username: string
): Promise<boolean> =>
  checksum ===
  (await generateContentChecksum(id, title, content, timestamp, username));
