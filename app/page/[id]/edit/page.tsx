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
      <section id="home" className="min-h-screen mt-20">
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
