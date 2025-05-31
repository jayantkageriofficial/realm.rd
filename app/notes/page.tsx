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
