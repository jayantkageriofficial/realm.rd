"use server";

import React from "react";
import NotFound from "@/app/not-found";
import EditNote from "@/components/notes/edit";
import { getNote } from "@/lib/actions/notes";

export default async function Edit(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const res = await getNote(params.id);
  if (!res) return <NotFound />;
  const note = JSON.parse(res);

  return (
    <>
      <section id="edit-note" className="min-h-screen mt-20">
        <div className="m-4 md:flex md:justify-center md:items-center">
          <div className="md:w-1/2 px-4 mb-4 md:mb-0">
            <div className="text-gray-400 md:text-lg italic font-normal">
              {note.id}
            </div>
            <h1 className="text-3xl font-bold text-white">
              {note.title}
              <span className="text-red-600">.RD</span>
            </h1>
            <div className="text-gray-400 md:text-lg italic font-normal">
              {new Date(note.timestamp).toLocaleString()}
            </div>
          </div>
          <EditNote id={note.id} title={note.title} content={note.content} />
        </div>
      </section>
    </>
  );
}
