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

"use server";

import { cookies, headers } from "next/headers";
import verify from "@/lib/actions/verify";
import type { User } from "@/lib/database/schema";
import {
	changeLockPassword,
	changePassword,
	login,
} from "@/lib/operations/auth";
import { getClientIp } from "@/lib/operations/ip";

export async function Login(
	username: string,
	password: string,
): Promise<string | null> {
	const cookieStore = await cookies();
	const ip = getClientIp(await headers());
	const auth = await login(username, password, ip as string);
	if (!auth) return null;
	if (auth === "locked") return "locked";
	cookieStore.set("session", auth);
	return auth;
}

export async function ChangePassword(
	old: string,
	newPwd: string,
): Promise<string | null> {
	const cookieStore = await cookies();
	const user: User = (await verify()) as User;
	const ip = getClientIp(await headers());
	const res = await changePassword(user.username, old, newPwd, ip || "");
	if (res) {
		cookieStore.set("session", res);
		return res;
	}
	return null;
}

export async function ChangeLockPassword(
	old: string,
	newPwd: string,
): Promise<boolean | null> {
	const user: User = (await verify()) as User;
	const ip = getClientIp(await headers());
	const res = await changeLockPassword(user.username, old, newPwd, ip || "");
	return res;
}
