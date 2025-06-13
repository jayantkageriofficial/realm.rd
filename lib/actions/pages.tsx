/*
 realm.rd, Scribble the plans, spill the thoughts.
 Copyright (C) 2025 Jayant Hegde Kageri <https://github.com/jayantkageri/>

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

"use server";

import { customAlphabet } from "nanoid";
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
    customAlphabet("1234567890abcdef", 9)(),
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
  return page?.id || "";
}

export async function dltPage(id: string): Promise<string | null> {
  const user = await verify();
  const page = await dlt(id, user as User);
  return page?.id || null;
}
