/*
 realm.rd, Scribble the plans, spill the thoughts.
 Copyright (C) 2025 Jayant Hegde Kageri <https://github.com/jayantkageri/>

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

import React from "react";
import { redirect } from "next/navigation";
import { MDXEditor } from "@mdxeditor/editor";
import { plugins } from "@/components/misc/Editor";

export default function Markdown(props: {
  content: string;
  id?: string;
  type?: "page" | "notes";
}) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === "e") {
        e.preventDefault();
        redirect(`/${props.type}/${props.id}/edit`);
      }
    };
    if (props.type) window.addEventListener("keydown", handleKeyDown);
    return () => {
      if (props.type) window.removeEventListener("keydown", handleKeyDown);
    };
  }, [props.type, props.id]);

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
