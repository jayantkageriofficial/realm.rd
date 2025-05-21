"use server";

import verify from "@/lib/actions/verify";
import { cookies, headers } from "next/headers";
import {
  login,
  changePassword,
  changeLockPassword,
} from "@/lib/operations/auth";
import { getClientIp } from "@/lib/operations/ip";
import { type User } from "@/lib/database/schema";

export async function Login(
  username: string,
  password: string
): Promise<string | null> {
  const cookieStore = await cookies();
  const ip = getClientIp(await headers());
  const auth = await login(username, password, ip as string);
  if (!auth) return null;
  if (auth == "locked") return "locked";
  cookieStore.set("session", JSON.stringify(auth));
  return JSON.stringify(auth);
}

export async function ChangePassword(
  old: string,
  newPwd: string
): Promise<string | null> {
  const cookieStore = await cookies();
  const user: User = (await verify()) as User;
  const ip = getClientIp(await headers());
  const res = await changePassword(user.username, old, newPwd, ip || "");
  if (res) {
    cookieStore.set("session", JSON.stringify(res));
    return JSON.stringify(res);
  }
  return null;
}

export async function ChangeLockPassword(
  old: string,
  newPwd: string
): Promise<boolean | null> {
  const user: User = (await verify()) as User;
  const res = await changeLockPassword(user.username, old, newPwd);
  return res;
}
