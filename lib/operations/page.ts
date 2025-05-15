import { PageSchema, type User } from "@/lib/database/schema";
import { encryptData } from "@/lib/operations/encryption";

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
