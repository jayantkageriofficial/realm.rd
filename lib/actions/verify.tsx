"use server";

import { cookies, headers } from "next/headers";
import { verify } from "@/lib/operations/auth";
import { getClientIp } from "@/lib/operations/ip";

export default async function Verify() {
  const cookieStore = await cookies();
  const ip = getClientIp(await headers());
  const cookie = cookieStore.get("session");
  if (!cookie?.value) return false;
  const auth = await verify(cookie.value, ip as string);
  if (!auth?.username) return null;
  return auth;
}
