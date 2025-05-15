"use server";

import React from "react";
import { getPage } from "@/lib/actions/pages";
import Markdown from "@/components/Markdown";

export default async function Page({ params }: { params: { id: string } }) {
  const res = await getPage(params.id);
  if (!res)
    return (
      <div className="text-white text-2xl m-5 flex justify-center min-h-screen">
        Not Found
      </div>
    );
  const page = JSON.parse(res);
  const date = new Date(page.timestamp);
  return (
    <>
      <section id="home" className="min-h-screen mt-10 m-4">
        <div className="md:flex md:justify-center md:items-center">
          <h1 className="mt-4 text-3xl font-bold text-white">
            {page.title}
            <span className="text-red-600">.RD</span>
          </h1>
        </div>
        <div className="flex justify-between mx-4 mt-2">
          <span className="text-gray-100 italic">{date.toLocaleString()}</span>
          <span className="text-gray-100 italic">- {page.user.name}</span>
        </div>
        <div>
          <Markdown content={page.content} />
        </div>
      </section>
    </>
  );
}
