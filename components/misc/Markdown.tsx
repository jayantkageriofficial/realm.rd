"use client";

import React from "react";
import MDEditor from "@uiw/react-md-editor";

export default function Markdown(props: { content: string }) {
  return (
    <>
      <div className="prose prose-invert max-w-none">
        <MDEditor.Markdown
          source={props.content}
          className="!bg-transparent !p-0 wmde-markdown "
          components={{
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            img: ({ node, ...props }) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                {...props}
                className="rounded-lg border p-2 mx-2"
                alt={props.alt || ""}
              />
            ),
          }}
        />
      </div>
    </>
  );
}
