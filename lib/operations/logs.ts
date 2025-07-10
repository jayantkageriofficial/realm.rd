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
import { getDate } from "@/lib/operations/auth";

export async function log(
  category: "login" | "lock" | "password" | "build",
  message: string,
  ip: string,
  date: Date
): Promise<boolean | null> {
  const msg = `
$REALM $${category.toUpperCase()}

${message}

Host: ${Config.DOMAIN}
IP Address: \`${ip}\` (ipinfo.io/${ip})
Timestamp: ${getDate(date)}

__realm.rd__
    `;
  try {
    const req = await fetch(
      `https://api.telegram.org/bot${Config.TG_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Access-Control-Allow-Origin": "https://api.telegram.org",
          "Content-Type": "application/json",
        },
        redirect: "follow",
        body: JSON.stringify({
          chat_id: Config.TG_CHAT_ID,
          text: msg,
          disable_web_page_preview: true,
          parse_mode: "markdown",
        }),
      }
    );
    const res = await req.json();
    return res.ok;
  } catch {
    return null;
  }
}
