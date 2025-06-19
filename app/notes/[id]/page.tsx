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
import Link from "next/link";
// import type { Metadata } from "next";
import NotFound from "@/app/not-found";
import Dlt from "@/components/notes/dlt";
import Markdown from "@/components/misc/Markdown";
import { getNote } from "@/lib/actions/notes";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const res = await getNote(params.id);
  if (!res) return <NotFound />;
  const note = JSON.parse(res);

  return (
    <>
      <section id="note" className="min-h-screen mt-10 m-4">
        <div className="flex justify-end items-center space-x-2">
          <Link href={`/notes/${params.id}/edit`}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5 text-gray-200 hover:text-blue-600 hover:transition-colors hover:transform-fill"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
              />
            </svg>
          </Link>

          <Dlt id={params.id} />
        </div>

        <div className="md:flex md:justify-center md:items-center">
          <h1 className="mt-4 text-3xl font-bold text-white">
            {note.title}
            <span className="text-red-600">.RD</span>
          </h1>
        </div>
        <div className="flex justify-end mx-4 mt-2 mb-4">
          <span className="text-gray-100 italic">
            <span className="text-gray-600">
              {new Date(note.timestamp).toLocaleString()}
            </span>
          </span>
        </div>
        <div>
          <Markdown content={note.content} id={params.id} type={"note"} />
        </div>
      </section>
    </>
  );
}

// export async function generateMetadata(
//   params: Promise<{ params: { id: string } }>
// ): Promise<Metadata> {
//   const { id } = (await params).params;
//   const page = await getNote(id);

//   if (page)
//     return {
//       title: JSON.parse(page).title,
//     };

//   return {};
// }
