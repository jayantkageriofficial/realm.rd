import { Schema, model, models } from "mongoose";
import Config from "@/lib/constant";

// Interfaces
interface User {
  name: string;
  username: string;
  password?: string;
  blockPassword?: string;
  lastPasswordChange?: Date;
  timestamp?: Date;
}

interface Token {
  username: string;
  token: string;
  timestamp?: Date;
}

interface Misc {
  blocked: boolean;
}

interface Page {
  id: string;
  title: string;
  content: string;
  date: Date;
  user?: User;
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
  blockPassword: {
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

const DBMiscSchema = new Schema<Misc>({
  blocked: {
    type: Boolean,
    default: false,
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
const MiscSchema = models.Misc || model("Misc", DBMiscSchema);
const PageSchema = models.Page || model("Page", DBPageSchema);
const NotesSchema = models.Notes || model("Notes", DBNotesSchema);

export { UserSchema, TokenSchema, MiscSchema, PageSchema, NotesSchema };

export type { User, Page, Misc, Notes };
