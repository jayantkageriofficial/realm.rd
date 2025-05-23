"use client";

import React from "react";
import { MDXEditor } from "@mdxeditor/editor";
import { plugins } from "@/components/misc/Editor";

export default function Markdown(props: { content: string }) {
  return (
    <>
      <div className="prose prose-invert max-w-none">
        <React.Suspense fallback={null}>
          <MDXEditor
            markdown={props.content}
            className="prose min-w-full dark-theme"
            plugins={plugins("", "view-only")}
            readOnly={true}
          />
        </React.Suspense>
      </div>
    </>
  );
}
