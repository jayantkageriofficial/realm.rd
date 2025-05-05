"use client";

import React from "react";
import MDEditor, { commands } from "@uiw/react-md-editor";

export default function Home() {
  const [value, setValue] = React.useState("");
  return (
    <>
      <div className="m-4 md:flex md:justify-center md:items-center">
        <div className="md:w-1/2 px-4 mb-4 md:mb-0">
          <h1 className="mt-4 text-3xl font-bold text-purple-600">
            REVAMP
            <span className="text-blue-700">.RD</span>
          </h1>
          <div className="text-gray-300 md:text-lg italic font-normal">
            Scribble the plans,{" "}
            <span className="text-red-500 underline font-bold">spill</span> the
            thoughts.
          </div>
        </div>
        <div className="md:w-1/2">
          <MDEditor
            value={value}
            className="prose max-w-full min-h-fit"
            onChange={(e) => setValue(e || "")}
            preview="live"
            data-color-mode="dark"
            commands={[
              commands.bold,
              commands.italic,
              commands.strikethrough,
              commands.divider,
              commands.link,
              commands.quote,
              commands.code,
              commands.codeBlock,
              commands.image,
              commands.table,
              commands.divider,
              commands.unorderedListCommand,
              commands.orderedListCommand,
              commands.checkedListCommand,
            ]}
            extraCommands={[
              commands.codeEdit,
              commands.codeLive,
              commands.codePreview,
            ]}
          />

          <button className="flex items-center px-4 py-2 mt-3 font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-blue-700 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-80 cursor-pointer w-full justify-center">
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
              <i>Spill it</i>
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
