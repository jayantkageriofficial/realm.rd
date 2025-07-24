/*
 realm.rd, Scribble the plans, spill the thoughts.
 Copyright (C) 2025 Jayant Hegde Kageri <https://jayantkageri.in/>

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
import { CryptoManager } from "@/lib/operations/encryption";
import { getRedisConnection } from "@/lib/database/connection";
import {
  generateContentChecksum,
  verifyContentChecksum,
} from "@/lib/operations/checksum";
import { lockdown } from "@/lib/operations/auth";
import { type Page, PageSchema, type User } from "@/lib/database/schema";

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
  const redis = await getRedisConnection();
  redis.set(
    page._id,
    await generateContentChecksum(
      page.id,
      name,
      encrypted,
      page.timestamp,
      user.username
    )
  );

  return page;
}

export async function get(id: string, user: User): Promise<Page | null> {
  const page: Page | null = await PageSchema.findOne({
    id,
  });
  if (!page || page.user?.username !== user.username) return null;

  const redis = await getRedisConnection();
  const checksum = await redis.get((page._id || "").toString());

  if (
    !checksum ||
    !(await verifyContentChecksum(
      checksum,
      id,
      page.title,
      page.content,
      page.timestamp as Date,
      page.user.username
    ))
  ) {
    await lockdown(false, user.username, "internal");
    return null;
  }

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

  const redis = await getRedisConnection();
  redis.set(
    page._id?.toString() || "",
    await generateContentChecksum(
      page.id,
      name,
      encrypted,
      page.timestamp as Date,
      page.user.username
    )
  );

  return res;
}

export async function dlt(id: string, user: User): Promise<Page | null> {
  const page = await PageSchema.findOne({
    id,
  });
  if (!page || page.user?.username !== user.username) return null;
  const res: Page | null = await PageSchema.findByIdAndDelete(page._id);
  const redis = await getRedisConnection();
  redis.del(page._id?.toString() || "");
  return res;
}
