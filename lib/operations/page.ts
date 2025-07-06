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

import { customAlphabet } from "nanoid";
import { type Page, PageSchema, type User } from "@/lib/database/schema";
import { CryptoManager } from "@/lib/operations/encryption";

export async function create(
  title: string,
  content: string,
  date: Date,
  user: User
): Promise<Page> {
  const crypto = new CryptoManager();
  const name = await crypto.encryptData(title);
  const encrypted = await crypto.encryptData(content);
  const page = await PageSchema.create({
    id: customAlphabet("1234567890abcdef", 9)(),
    title: name,
    content: encrypted,
    date,
    user,
  });
  return page;
}

export async function get(id: string, user: User): Promise<Page | null> {
  const page: Page | null = await PageSchema.findOne({
    id,
  });
  if (!page || page.user?.username !== user.username) return null;
  const crypto = new CryptoManager();
  const title = await crypto.decryptData(page.title);
  const content = await crypto.decryptData(page.content);
  return {
    id: page.id,
    title,
    content,
    date: page.date,
    timestamp: page.timestamp,
    user: page.user,
  } as Page;
}

export async function getCount(user: User): Promise<number> {
  const res = await PageSchema.countDocuments({
    "user.username": user.username,
  });
  return res || 0;
}

export async function getAll(
  user: User,
  page?: number
): Promise<Page[] | null> {
  const res = await PageSchema.find({
    "user.username": user.username,
  })
    .sort({ date: -1, timestamp: -1 })
    .limit((page || 1) * 10);
  const results = await Promise.all(res.map((page) => get(page.id, user)));
  const pages: Page[] | null = results.filter(
    (page): page is Page => page !== null
  );
  return pages;
}

export async function edit(
  id: string,
  title: string,
  content: string,
  date: Date,
  user: User
): Promise<Page | null> {
  const page = await PageSchema.findOne({
    id,
  });
  if (!page || page.user?.username !== user.username) return null;

  const crypto = new CryptoManager();
  const name = await crypto.encryptData(title);
  const encrypted = await crypto.encryptData(content);
  const res = await PageSchema.findByIdAndUpdate(page._id, {
    title: name,
    content: encrypted,
    date,
  });
  return res;
}

export async function dlt(id: string, user: User): Promise<Page | null> {
  const page = await PageSchema.findOne({
    id,
  });
  if (!page || page.user?.username !== user.username) return null;
  const res = await PageSchema.findByIdAndDelete(page._id);
  return res;
}
