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

import { model, models, Schema } from "mongoose";
import Config from "@/lib/constant";

// Interfaces
interface User {
	username: string;
	password?: string;
	blockPassword?: string;
	lastPasswordChange?: Date;
	checksum?: string
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

interface Expenditure {
	id: string;
	month: string;
	content: string;
	user: User;
	timestamp?: Date;
}

const DBUserSchema = new Schema<User>({
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
	checksum: {
		type: String,
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

const DBExpSchema = new Schema<Expenditure>({
	id: {
		type: String,
		required: true,
		unique: true,
	},
	month: {
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
	}
});

// Models
const UserSchema = models.Users || model("Users", DBUserSchema);
const TokenSchema = models.Tokens || model("Tokens", DBTokenSchema);
const MiscSchema = models.Misc || model("Misc", DBMiscSchema);
const PageSchema = models.Page || model("Page", DBPageSchema);
const NotesSchema = models.Notes || model("Notes", DBNotesSchema);
const ExpSchema = models.Expenditure || model("Expenditure", DBExpSchema);

export {
	UserSchema,
	TokenSchema,
	MiscSchema,
	PageSchema,
	NotesSchema,
	ExpSchema,
};

export type { User, Page, Misc, Notes, Expenditure };
