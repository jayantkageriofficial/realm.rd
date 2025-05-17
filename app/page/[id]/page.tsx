"use server";

import React from "react";
import NotFound from "@/app/not-found";
import Markdown from "@/components/Markdown";
import { getPage } from "@/lib/actions/pages";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const res = await getPage(params.id);
  if (!res) return <NotFound />;
  const page = JSON.parse(res);

  return (
    <>
      <section id="home" className="min-h-screen mt-10 m-4">
        <div className="md:flex md:justify-center md:items-center">
          <h1 className="mt-4 text-3xl font-bold text-white">
            {page.title}
            <span className="text-red-600">.RD</span>
          </h1>
        </div>
        <div className="flex justify-between mx-4 mt-2 mb-4">
          <span className="text-gray-100 italic">
            {new Date(page.date).toLocaleDateString()}
          </span>
          <span className="text-gray-100 italic">
            - {page.user.name}
            <br />
            <span className="text-gray-600">
              {new Date(page.timestamp).toLocaleString()}
            </span>
          </span>
        </div>
        <div>
          <Markdown content={page.content} />
        </div>
      </section>
    </>
  );
}
