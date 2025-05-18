"use server";

import React from "react";
import Link from "next/link";
import NotFound from "@/app/not-found";
import DltPage from "@/components/DltPage";
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
        <div className="flex justify-end items-center space-x-2">
          <Link href={`/page/${params.id}/edit`}>
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

          <DltPage id={params.id} />
        </div>

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
