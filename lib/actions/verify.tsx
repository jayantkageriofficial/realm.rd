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
import { verify } from "@/lib/operations/auth";
import { getClientIp } from "@/lib/operations/ip";

export default async function Verify() {
	const cookieStore = await cookies();
	const ip = getClientIp(await headers());
	const cookie = cookieStore.get("session");
	if (!cookie?.value) return false;
	const auth = await verify(cookie.value, ip as string);
	if (!auth?.username) return null;
	return auth;
}
