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
            className="prose max-w-none"
            onChange={(e) => setValue(e || "")}
            preview="edit"
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
        </div>
      </div>
    </>
  );
}
