import { cookies, headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Config from "@/lib/constant";
import { getClientIp } from "@/lib/operations/ip";
import { isConnected } from "@/lib/database/connection";
import { verify as verifyToken } from "@/lib/operations/auth";

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
  runtime: "nodejs",
};

async function verify(): Promise<boolean> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("session");
  const ip = getClientIp(await headers());
  if (!cookie?.value) return false;
  const auth = await verifyToken(cookie.value, ip || "");
  if (auth?.username) return true;
  cookieStore.delete("session");
  return false;
}

export async function middleware(req: NextRequest) {
  const ping = isConnected();
  const locked = req.nextUrl.pathname == "/locked";

  if (!ping && !locked) return NextResponse.redirect(`${Config.DOMAIN}/locked`);
  if (!ping && locked) return NextResponse.next();
  if (ping && locked) return NextResponse.redirect(Config.DOMAIN);

  const verification = await verify();
  const login = req.nextUrl.pathname == "/auth/login";
  if (!verification && !login)
    return NextResponse.redirect(
      `${Config.DOMAIN}/auth/login?path=${req.nextUrl.pathname}`
    );
  if (verification && login) return NextResponse.redirect(Config.DOMAIN);
  return NextResponse.next();
}
