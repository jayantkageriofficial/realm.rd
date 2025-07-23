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
import { type Notes, NotesSchema, type User } from "@/lib/database/schema";

export async function create(title: string, content: string, user: User) {
  const crypto = new CryptoManager();
  const name = await crypto.encryptData(title);
  const encrypted = await crypto.encryptData(content);
  const note = await NotesSchema.create({
    id: customAlphabet("1234567890abcdef", 9)(),
    title: name,
    content: encrypted,
    user,
  });
  const redis = await getRedisConnection();
  redis.set(
    note._id,
    await generateContentChecksum(
      note.id,
      name,
      encrypted,
      note.timestamp,
      user.username
    )
  );
  return note;
}

export async function get(id: string, user: User): Promise<Notes | null> {
  const note: Notes | null = await NotesSchema.findOne({
    id,
  });
  if (!note || note.user?.username !== user.username) return null;

  const redis = await getRedisConnection();
  const checksum = await redis.get((note._id || "").toString());

  if (
    !checksum ||
    !(await verifyContentChecksum(
      checksum,
      id,
      note.title,
      note.content,
      note.timestamp as Date,
      note.user.username
    ))
  ) {
    await lockdown(false, user.username, "internal");
    return null;
  }

  const crypto = new CryptoManager();
  const title = await crypto.decryptData(note.title);
  const content = await crypto.decryptData(note.content);

  return {
    id: note.id,
    title,
    content,
    timestamp: note.timestamp,
    user: note.user,
  } as Notes;
}

export async function getCount(user: User): Promise<number> {
  const res = await NotesSchema.countDocuments({
    "user.username": user.username,
  });
  return res || 0;
}

export async function getAll(
  user: User,
  page?: number
): Promise<Notes[] | null> {
  const res = await NotesSchema.find({
    "user.username": user.username,
  })
    .sort({ date: -1, timestamp: -1 })
    .limit((page || 1) * 10);
  const results = await Promise.all(res.map((page) => get(page.id, user)));
  const notes: Notes[] | null = results.filter(
    (note): note is Notes => note !== null
  );
  return notes;
}

export async function edit(
  id: string,
  title: string,
  content: string,
  user: User
) {
  const note: Notes | null = await NotesSchema.findOne({
    id,
  });
  if (!note || note.user?.username !== user.username) return null;

  const crypto = new CryptoManager();
  const name = await crypto.encryptData(title);
  const encrypted = await crypto.encryptData(content);

  const res = await NotesSchema.findByIdAndUpdate(note._id, {
    title: name,
    content: encrypted,
  });

  const redis = await getRedisConnection();
  redis.set(
    note._id?.toString() || "",
    await generateContentChecksum(
      note.id,
      name,
      encrypted,
      note.timestamp as Date,
      note.user.username
    )
  );

  return res;
}

export async function dlt(id: string, user: User): Promise<Notes | null> {
  const note = await NotesSchema.findOne({
    id,
  });
  if (!note || note.user?.username !== user.username) return null;
  const res: Notes | null = await NotesSchema.findByIdAndDelete(note._id);
  return res;
}
