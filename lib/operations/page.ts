import { PageSchema } from "@/lib/database/modals";

export async function create(
  id: string,
  title: string,
  content: string,
  date: Date
  //   user: string
) {
  const page = await PageSchema.create({
    id,
    title,
    content,
    date,
    // user,
  });
  console.log(page);
  return page;
}
