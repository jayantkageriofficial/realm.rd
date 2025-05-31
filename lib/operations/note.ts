import { NotesSchema, type User, type Notes } from "@/lib/database/schema";
import { encryptData, decryptData } from "@/lib/operations/encryption";

export async function create(
  id: string,
  title: string,
  content: string,
  user: User
) {
  const name = await encryptData(title);
  const encrypted = await encryptData(content);
  const page = await NotesSchema.create({
    id,
    title: name,
    content: encrypted,
    user,
  });
  return page;
}

export async function get(id: string, user: User): Promise<Notes | null> {
  const note: Notes | null = await NotesSchema.findOne({
    id,
  });
  if (!note || note.user?.username !== user.username) return null;
  const title = await decryptData(note.title);
  const content = await decryptData(note.content);
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
  const note = await NotesSchema.findOne({
    id,
  });
  if (!note || note.user?.username !== user.username) return null;

  const name = await encryptData(title);
  const encrypted = await encryptData(content);
  const res = await NotesSchema.findByIdAndUpdate(note._id, {
    title: name,
    content: encrypted,
  });
  return res;
}

export async function dlt(id: string, user: User) {
  const note = await NotesSchema.findOne({
    id,
  });
  if (!note || note.user?.username !== user.username) return null;
  const res = await NotesSchema.findByIdAndDelete(note._id);
  return res;
}
