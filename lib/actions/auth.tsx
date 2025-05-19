"use server";

import { cookies, headers } from "next/headers";
import { login } from "@/lib/operations/auth";
import { getClientIp } from "@/lib/operations/ip";

export async function Login(username: string, password: string) {
  const cookieStore = await cookies();
  const ip = getClientIp(await headers());
  const auth = await login(username, password, ip as string);
  if (!auth) return null;
  if (auth == "locked") return "locked";
  cookieStore.set("session", JSON.stringify(auth));
  return JSON.stringify(auth);
}
