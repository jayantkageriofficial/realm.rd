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
  console.log(page);
  return page;
}

export async function get(id: string, user: User): Promise<Page | null> {
  const page: Page | null = await PageSchema.findOne({
    id,
  });
  if (!page) return null;
  if (page.user?.username !== user.username) return null;
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

export async function getAll(
  user: User,
  page?: number
): Promise<Page[] | null> {
  const res = await PageSchema.find({
    "user.username": user.username,
  })
    .sort({ date: -1 })
    .limit((page || 1) * 20);
  const results = await Promise.all(res.map((page) => get(page.id, user)));
  const pages: Page[] | null = results.filter(
    (page): page is Page => page !== null
  );
  return pages;
}
