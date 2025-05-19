"use server";

import React from "react";
import NotFound from "@/app/not-found";
import verify from "@/lib/actions/verify";
import { getAll, getCount } from "@/lib/operations/page";
import Pages from "@/components/pages/mapper";

export default async function Page() {
  const user = await verify();
  if (!user) return <NotFound />;
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
