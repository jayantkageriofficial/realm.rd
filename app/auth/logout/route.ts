import { NextRequest } from "next/server";
import { cookies, headers } from "next/headers";
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
