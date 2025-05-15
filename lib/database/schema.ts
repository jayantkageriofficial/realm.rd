import { Schema, model, models } from "mongoose";
import Config from "@/lib/constant";

// Interfaces
interface User {
  name: string;
  username: string;
  password?: string;
  lastPasswordChange?: Date;
  timestamp?: Date;
}

interface Token {
  username: string;
  token: string;
  timestamp?: Date;
}

interface Page {
  id: string;
  title: string;
  content: string;
  date: Date;
  user?: User;
  timestamp?: Date;
}

interface Todo {
  id: string;
  title: string;
  content: string;
  completion: Date;
  user: User;
  timestamp?: Date;
}

interface Notes {
  id: string;
  title: string;
  content: string;
  user: User;
  timestamp?: Date;
}

const DBUserSchema = new Schema<User>({
  name: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  lastPasswordChange: {
    type: Date,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const DBTokenSchema = new Schema<Token>({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  token: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    expires: Config.SESSION_DURATION * 60,
  },
});

const DBPageSchema = new Schema<Page>({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  user: {
    type: Object,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const DBTodoSchema = new Schema<Todo>({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  completion: {
    type: Date,
    default: Date.now,
  },
  user: {
    type: Object,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const DBNotesSchema = new Schema<Notes>({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  user: {
    type: Object,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Models
const UserSchema = models.Users || model("Users", DBUserSchema);
const TokenSchema = models.Tokens || model("Tokens", DBTokenSchema);
const PageSchema = models.Page || model("Page", DBPageSchema);
const TodoSchema = models.Todo || model("Todo", DBTodoSchema);
const NotesSchema = models.Notes || model("Notes", DBNotesSchema);

export { UserSchema, TokenSchema, PageSchema, TodoSchema, NotesSchema };

export type { User, Page, Todo, Notes };
