import {
  toolbarPlugin,
  listsPlugin,
  quotePlugin,
  headingsPlugin,
  linkPlugin,
  linkDialogPlugin,
  imagePlugin,
  tablePlugin,
  codeBlockPlugin,
  diffSourcePlugin,
  markdownShortcutPlugin,
  BoldItalicUnderlineToggles,
  CodeToggle,
  Separator,
  ListsToggle,
  CreateLink,
  InsertImage,
  DiffSourceToggleWrapper,
  InsertCodeBlock,
  type RealmPlugin,
  codeMirrorPlugin,
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
    }),
    diffSourcePlugin({
      viewMode: mode == "view-only" ? "rich-text" : mode,
      diffMarkdown: md,
    }),
    markdownShortcutPlugin(),
    mode != "view-only" &&
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
