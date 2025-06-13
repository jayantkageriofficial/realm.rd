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

import React from "react";
import NotFound from "@/app/not-found";
import verify from "@/lib/actions/verify";
import { getAll, getCount } from "@/lib/operations/note";
import Notes from "@/components/notes/mapper";

export default async function Note() {
  const user = await verify();
  if (!user) return <NotFound />;
  const notes = await getAll(user);
  const count = await getCount(user);

  return (
    <>
      <section id="notes" className="min-h-screen m-4 mb-8">
        {notes && <Notes total={count} init={notes} />}
      </section>
    </>
  );
}
