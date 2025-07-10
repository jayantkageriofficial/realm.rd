/*
 realm.rd, Scribble the plans, spill the thoughts.
 Copyright (C) 2025 Jayant Hegde Kageri <https://jayantkageri.in/>

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

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Pages from "@/components/pages/mapper";
import verify from "@/lib/actions/verify";
import { getAll, getCount } from "@/lib/operations/page";

export default async function Page() {
  const user = await verify();
  if (!user) return notFound();
  const pages = await getAll(user);
  const count = await getCount(user);

  return (
    <>
      <section id="pages" className="min-h-screen m-4 mb-8">
        {pages && <Pages total={count} init={pages} />}
      </section>
    </>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Pages",
  };
}
