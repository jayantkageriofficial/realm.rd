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

import verify from "@/lib/actions/verify";
import type { User } from "@/lib/database/schema";
import { create, dlt, edit, get, getAll } from "@/lib/operations/exp";

export async function createMonth(
	month: string,
	context: string,
): Promise<string> {
	const user = await verify();
	const data = await create(month, context, user as User);
	return data.id;
}

export async function getMonth(id: string): Promise<string | null> {
	const user = await verify();
	const data = await get(id, user as User);
	if (!data) return null;
	return JSON.stringify(data);
}

export async function getMonths(page: number) {
	const user = await verify();
	const data = await getAll(user as User, page);
	return JSON.stringify(data);
}

export async function editMonth(
	id: string,
	month: string,
	context: string,
): Promise<string> {
	const user = await verify();
	const data = await edit(id, month, context, user as User);
	return data?.id || "";
}

export async function dltMonth(id: string): Promise<string | null> {
	const user = await verify();
	const note = await dlt(id, user as User);
	return note?.id || null;
}
