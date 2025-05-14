import { PageSchema, type User } from "@/lib/database/schema";

export async function create(
  id: string,
  title: string,
  content: string,
  date: Date,
  user: User
) {
  const page = await PageSchema.create({
    id,
    title,
    content,
    date,
    user,
  });
  console.log(page);
  return page;
}
