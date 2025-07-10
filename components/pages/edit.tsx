/*
 realm.rd, Scribble the plans, spill the thoughts.
 Copyright (C) 2025 Jayant Hegde Kageri <https://jayantkageri.in/>

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

"use client";

import type { MDXEditorMethods } from "@mdxeditor/editor";
import { MDXEditor } from "@mdxeditor/editor";
import { redirect } from "next/navigation";
import React from "react";
import toast from "react-hot-toast";
import { plugins } from "@/components/misc/Editor";
import { editPage } from "@/lib/actions/pages";

const toDate = (str: string): Date => {
  return new Date(str);
};

export default function EditPage(props: {
  id: string;
  title: string;
  content: string;
  date: string;
}) {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .replace(/\//g, "-");
  const editor = React.useRef<MDXEditorMethods>(null);

  const [info, setInfo] = React.useState<{
    id: string;
    title: string;
    value: string;
    loading: boolean;
    date: string;
  }>({
    id: props.id,
    title: props.title,
    value: props.content,
    date: props.date,
    loading: false,
  });

  const normalizeInput = React.useCallback(
    (str: string) => str.trim().replace(/\s+/g, " ").replace(/ +/g, " "),
    []
  );

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInfo({ ...info, [e.target.id]: e.target.value });
  };
  const onSubmit = React.useCallback(
    async (e: KeyboardEvent | React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      const id = toast.loading("Processing");
      const value = editor.current?.getMarkdown();

      setInfo({ ...info, loading: true });
      if (
        normalizeInput(value || "") === "" ||
        normalizeInput(info.title || "") === "" ||
        info.date === "" ||
        !(toDate(today) >= toDate(info.date))
      ) {
        setInfo({ ...info, loading: false });
        return toast.error("Invalid Details", { id });
      }

      const res = await editPage(
        info.id,
        info.title,
        value || "",
        new Date(info.date)
      );

      if (res) {
        toast.success("Updated the Page", { id });
        return redirect(`/page/${info.id}`);
      } else {
        toast.error("Internal Error", { id });
        setInfo({ ...info, loading: false });
      }
    },

    [info, today, normalizeInput]
  );

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        onSubmit(e);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onSubmit]);

  return (
    <div className="md:w-1/2">
      <input
        id="title"
        type="text"
        className="block mb-3 w-full py-3 border rounded-lg px-5 bg-[#0D1117] text-amber-50 border-gray-600 focus:border-blue-300 focus:ring-blue-300 focus:outline-none focus:ring focus:ring-opacity-40"
        placeholder="Title"
        autoComplete="off"
        value={info.title}
        onChange={onChange}
      />

      <MDXEditor
        markdown={info.value}
        ref={editor}
        className="prose min-w-full min-h-fit dark-theme"
        plugins={plugins(info.value, "rich-text")}
        readOnly={info.loading}
      />

      <input
        id="date"
        type="date"
        className="block mt-3 w-full py-3 border rounded-lg px-5 bg-[#0D1117] text-amber-50 border-gray-600 focus:border-blue-300 focus:ring-blue-300 focus:outline-none focus:ring focus:ring-opacity-40 "
        placeholder="Date"
        autoComplete="off"
        max={new Date().toISOString().split("T")[0]}
        value={info.date}
        onChange={onChange}
      />

      <button
        type="submit"
        className="flex items-center px-4 py-2 mt-3 font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-red-600 rounded-lg hover:bg-red-500 focus:outline-none focus:ring focus:ring-blue-500 focus:ring-opacity-80 cursor-pointer w-full justify-center"
        onClick={onSubmit}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5 mx-0.5"
        >
          <title>Update Icon</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
          />
        </svg>

        <span className="mx-0.5 lowercase">
          <i>update it</i>
        </span>
      </button>
    </div>
  );
}

export const dynamic = "force-dynamic";
