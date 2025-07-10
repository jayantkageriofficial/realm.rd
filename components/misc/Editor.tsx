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

import { oneDark } from "@codemirror/theme-one-dark";
import {
  BoldItalicUnderlineToggles,
  CodeToggle,
  CreateLink,
  codeBlockPlugin,
  codeMirrorPlugin,
  DiffSourceToggleWrapper,
  diffSourcePlugin,
  headingsPlugin,
  InsertCodeBlock,
  InsertImage,
  imagePlugin,
  ListsToggle,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  quotePlugin,
  type RealmPlugin,
  Separator,
  tablePlugin,
  toolbarPlugin,
} from "@mdxeditor/editor";

const plugins = (
  md: string,
  mode: "rich-text" | "source" | "diff" | "view-only"
) =>
  [
    listsPlugin(),
    quotePlugin(),
    headingsPlugin(),
    linkPlugin(),
    linkDialogPlugin(),
    imagePlugin({}),
    tablePlugin(),
    codeBlockPlugin({ defaultCodeBlockLanguage: "txt" }),
    codeMirrorPlugin({
      codeBlockLanguages: {
        js: "JavaScript",
        jsx: "JSX",
        ts: "TypeScript",
        tsx: "TSX",
        py: "Python",
        css: "CSS",
        html: "HTML",
        json: "JSON",
        xml: "XML",
        md: "Markdown",
        sql: "SQL",
        bash: "Bash",
        sh: "Shell",
        c: "C",
        cpp: "C++",
        java: "Java",
        php: "PHP",
        ruby: "Ruby",
        go: "Go",
        rust: "Rust",
        yaml: "YAML",
        txt: "Text",
      },
      codeMirrorExtensions: [oneDark],
    }),
    diffSourcePlugin({
      viewMode: mode === "view-only" ? "rich-text" : mode,
      diffMarkdown: md,
    }),
    markdownShortcutPlugin(),
    mode !== "view-only" &&
      toolbarPlugin({
        toolbarContents: () => (
          <>
            <DiffSourceToggleWrapper>
              <BoldItalicUnderlineToggles />
              <Separator />
              <ListsToggle />
              <Separator />
              <InsertCodeBlock />
              <CodeToggle />
              <Separator />
              <CreateLink />
              <InsertImage />
            </DiffSourceToggleWrapper>
          </>
        ),
      }),
  ].filter(Boolean) as RealmPlugin[];

export { plugins };
