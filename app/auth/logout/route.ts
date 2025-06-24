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

import { cookies, headers } from "next/headers";
import type { NextRequest } from "next/server";
import Config from "@/lib/constant";
import { logout } from "@/lib/operations/auth";
import { getClientIp } from "@/lib/operations/ip";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const cookieStore = await cookies();
  const cookie = cookieStore.get("session");
  const ip = getClientIp(await headers());
  if (cookie?.value) await logout(cookie.value, ip || "");
  cookieStore.delete("session");
  return Response.redirect(
    `${Config.DOMAIN}/auth/login?path=${url.searchParams.get("path") || "/"}`
  );
}
