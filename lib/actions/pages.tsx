"use server";

import { create, get, edit, dlt, getAll } from "@/lib/operations/page";
import verify from "@/lib/actions/verify";
import { type User } from "@/lib/database/schema";

export async function createPage(
  title: string,
  context: string,
  date: Date
): Promise<string> {
  const user = await verify();
  const page = await create(
    new Date().getTime().toString(),
    title,
    context,
    date,
    user as User
  );
  return page.id;
}

export async function getPage(id: string): Promise<string | null> {
  const user = await verify();
  const page = await get(id, user as User);
  if (!page) return null;
  return JSON.stringify(page);
}

export async function getPages(page: number) {
  const user = await verify();
  const pages = await getAll(user as User, page);
  return JSON.stringify(pages);
}

export async function editPage(
  id: string,
  title: string,
  context: string,
  date: Date
): Promise<string> {
  const user = await verify();
  const page = await edit(id, title, context, date, user as User);
  return page.id;
}

export async function dltPage(id: string): Promise<string | null> {
  const user = await verify();
  const page = await dlt(id, user as User);
  return page.id || page;
}
