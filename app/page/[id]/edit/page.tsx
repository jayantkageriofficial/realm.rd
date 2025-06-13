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
import EditPage from "@/components/pages/edit";
import { getPage } from "@/lib/actions/pages";

export default async function Edit(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const res = await getPage(params.id);
  if (!res) return <NotFound />;
  const page = JSON.parse(res);

  return (
    <>
      <section id="edit-page" className="min-h-screen mt-20">
        <div className="m-4 md:flex md:justify-center md:items-center">
          <div className="md:w-1/2 px-4 mb-4 md:mb-0">
            <div className="text-gray-400 md:text-lg italic font-normal">
              {page.id}
            </div>
            <h1 className="text-3xl font-bold text-white">
              {page.title}
              <span className="text-red-600">.RD</span>
            </h1>
            <div className="text-gray-400 md:text-lg italic font-normal">
              {new Date(page.timestamp).toLocaleString()}
            </div>
          </div>
          <EditPage
            id={page.id}
            title={page.title}
            content={page.content}
            date={new Date(page.date).toISOString().split("T")[0]}
          />
        </div>
      </section>
    </>
  );
}
