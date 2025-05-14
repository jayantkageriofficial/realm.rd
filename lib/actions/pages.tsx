"use server";

import { create } from "@/lib/operations/page";
import verify from "@/lib/actions/verify";
import { type User } from "@/lib/database/schema";

export async function createPage(context: string) {
  const date = new Date();
  const title = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
  const user = await verify();
  const res = await create(
    date.getTime().toString(),
    title,
    context,
    date,
    user as User
  );
  return res.id;
}
