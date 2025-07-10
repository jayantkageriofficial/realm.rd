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

import { cookies, headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import Config from "@/lib/constant";
import { isConnected, getRedisConnection } from "@/lib/database/connection";
import { verify as verifyToken } from "@/lib/operations/auth";
import { getClientIp } from "@/lib/operations/ip";

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
  runtime: "nodejs",
};

async function verify(ip: string): Promise<boolean> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("session");
  if (!cookie?.value) return false;
  const auth = await verifyToken(cookie.value, ip || "");
  if (auth?.username) return true;
  cookieStore.delete("session");
  return false;
}

export async function middleware(req: NextRequest) {
  const ping = isConnected().both;
  const locked = req.nextUrl.pathname === "/locked";
  const logout = req.nextUrl.pathname === "/auth/logout";

  if (!ping)
    return locked
      ? NextResponse.next()
      : NextResponse.redirect(`${Config.DOMAIN}/locked`);

  if (locked) return NextResponse.redirect(Config.DOMAIN);

  const ip = getClientIp(await headers()) || "";
  const verification = await verify(ip);

  const login = req.nextUrl.pathname === "/auth/login";
  if (!verification) {
    const redisConn = await getRedisConnection();
    const key = `rate_limit:${ip}`;

    const current = await redisConn.incr(key);
    if (current === 1) await redisConn.expire(key, 60);
    if (current > 20) return new NextResponse(null, { status: 429 });

    if (!login || logout)
      return NextResponse.redirect(
        `${Config.DOMAIN}/auth/login?path=${
          logout ? "/" : req.nextUrl.pathname
        }`
      );

    if (verification && login) return NextResponse.redirect(Config.DOMAIN);
    return NextResponse.next();
  }
}
