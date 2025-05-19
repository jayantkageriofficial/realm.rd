import { PageSchema, type User, type Page } from "@/lib/database/schema";
import { encryptData, decryptData } from "@/lib/operations/encryption";

export async function create(
  id: string,
  title: string,
  content: string,
  date: Date,
  user: User
) {
  const name = await encryptData(title);
  const encrypted = await encryptData(content);
  const page = await PageSchema.create({
    id,
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
  const title = await decryptData(page.title);
  const content = await decryptData(page.content);
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
) {
  const page = await PageSchema.findOne({
    id,
  });
  if (!page || page.user?.username !== user.username) return null;

  const name = await encryptData(title);
  const encrypted = await encryptData(content);
  const res = await PageSchema.findByIdAndUpdate(page._id, {
    title: name,
    content: encrypted,
    date,
  });
  return res;
}

export async function dlt(id: string, user: User) {
  const page = await PageSchema.findOne({
    id,
  });
  if (!page || page.user?.username !== user.username) return null;
  const res = await PageSchema.findByIdAndDelete(page._id);
  return res;
}
