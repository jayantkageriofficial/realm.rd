"use server";

import React from "react";
import Link from "next/link";
import NotFound from "@/app/not-found";
import verify from "@/lib/actions/verify";
import { getAll } from "@/lib/operations/page";

export default async function Page() {
  const user = await verify();
  if (!user) return <NotFound />;
  const pages = await getAll(user);

  return (
    <>
      <section id="pages" className="min-h-screen m-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold capitalize lg:text-3xl text-white">
            Recent <span className="text-red-600">Pages</span>
          </h1>
        </div>

        <hr className="mt-3 mb-8 border-gray-700" />

        {pages?.map((page) => (
          <div
            key={page.id}
            className="my-4 px-8 py-4 rounded-lg shadow-md border-2 border-secondary cursor-pointer hover:border-blue-700 hover:transition-all transform-fill"
          >
            <Link href={`/page/${page.id}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-light text-gray-400">
                  {page.date?.toLocaleDateString()}
                </span>
              </div>

              <div className="mt-2">
                <span
                  className="text-xl font-bold text-white hover:text-gray-200 md-hover-animation"
                  tabIndex={0}
                >
                  {page.title}
                </span>
                <p className="mt-2 text-gray-300">
                  {page.content?.length > 140
                    ? page.content?.slice(0, 140) + "..."
                    : page.content}
                </p>
              </div>
            </Link>
          </div>
        ))}
      </section>
    </>
  );
}
