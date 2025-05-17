"use server";

import { create, get } from "@/lib/operations/page";
import verify from "@/lib/actions/verify";
import { type User } from "@/lib/database/schema";

export async function createPage(title: string, context: string, date: Date) {
  const user = await verify();
  const res = await create(
    new Date().getTime().toString(),
    title,
    context,
    date,
    user as User
  );
  return res.id;
}

export async function getPage(id: string): Promise<string | null> {
  const user = await verify();
  const post = await get(id, user as User);
  if (!post) return null;
  return JSON.stringify(post);
}
