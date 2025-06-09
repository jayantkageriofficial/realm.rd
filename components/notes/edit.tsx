"use client";

import React from "react";
import toast from "react-hot-toast";
import { MDXEditor } from "@mdxeditor/editor";
import { type MDXEditorMethods } from "@mdxeditor/editor";
import { editNote } from "@/lib/actions/notes";
import { redirect } from "next/navigation";
import { plugins } from "@/components/misc/Editor";

export default function EditPage(props: {
  id: string;
  title: string;
  content: string;
}) {
  const editor = React.useRef<MDXEditorMethods>(null);

  const [info, setInfo] = React.useState<{
    id: string;
    title: string;
    value: string;
    loading: boolean;
  }>({
    id: props.id,
    title: props.title,
    value: props.content,
    loading: false,
  });

  const normalizeInput = (str: string) =>
    str.trim().replace(/\s+/g, " ").replace(/ +/g, " ");

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
        normalizeInput(value || "") == "" ||
        !info.title ||
        normalizeInput(info.title) == ""
      ) {
        setInfo({ ...info, loading: false });
        return toast.error("Invalid Details", { id });
      }

      const res = await editNote(info.id, info.title, value || "");

      if (res) {
        toast.success("Updated the Note", { id });
        return redirect(`/notes/${info.id}`);
      } else {
        toast.error("Internal Error", { id });
        setInfo({ ...info, loading: false });
      }
    },

    [info]
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
