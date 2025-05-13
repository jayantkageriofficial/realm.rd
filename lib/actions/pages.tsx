"use server";

import { create } from "@/lib/operations/page";

export async function createPage(context: string) {
  const date = new Date();
  const title = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;

  const res = await create(date.getTime().toString(), title, context, date);
  return res.id;
}
