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
import { type Expenditure, ExpSchema, type User } from "@/lib/database/schema";
import { decryptData, encryptData } from "@/lib/operations/encryption";

export async function create(month: string, content: string, user: User) {
  const name = await encryptData(month);
  const encrypted = await encryptData(content);
  const page = await ExpSchema.create({
    id: customAlphabet("1234567890abcdef", 9)(),
    month: name,
    content: encrypted,
    user,
  });
  return page;
}

export async function get(id: string, user: User): Promise<Expenditure | null> {
  const note: Expenditure | null = await ExpSchema.findOne({
    id,
  });
  if (!note || note.user?.username !== user.username) return null;
  const month = await decryptData(note.month);
  const content = await decryptData(note.content);
  return {
    id: note.id,
    month,
    content,
    timestamp: note.timestamp,
    user: note.user,
  } as Expenditure;
}

export async function getCount(user: User): Promise<number> {
  const res = await ExpSchema.countDocuments({
    "user.username": user.username,
  });
  return res || 0;
}

export async function getAll(
  user: User,
  page?: number
): Promise<Expenditure[] | null> {
  const res = await ExpSchema.find({
    "user.username": user.username,
  })
    .sort({ date: -1, timestamp: -1 })
    .limit((page || 1) * 10);
  const results = await Promise.all(res.map((page) => get(page.id, user)));
  const notes: Expenditure[] | null = results.filter(
    (exp): exp is Expenditure => exp !== null
  );
  return notes;
}

export async function edit(
  id: string,
  title: string,
  content: string,
  user: User
) {
  const exp = await ExpSchema.findOne({
    id,
  });
  if (!exp || exp.user?.username !== user.username) return null;

  const name = await encryptData(title);
  const encrypted = await encryptData(content);
  const res = await ExpSchema.findByIdAndUpdate(exp._id, {
    month: name,
    content: encrypted,
  });
  return res;
}

export async function dlt(id: string, user: User) {
  const exp = await ExpSchema.findOne({
    id,
  });
  if (!exp || exp.user?.username !== user.username) return null;
  const res = await ExpSchema.findByIdAndDelete(exp._id);
  return res;
}
