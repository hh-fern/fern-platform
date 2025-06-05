"use client";

import { EditorEvents } from "@tiptap/react";

import TiptapEditor from "./TiptapEditor";
import { htmlToMdx } from "./htmlToMdx";

export declare namespace Editor {
  export interface Props {
    initialHtml: string;
  }
}

// SEE: https://tiptap.dev/docs/editor/getting-started/install/react
export default function Editor({ initialHtml }: Editor.Props) {
  // TODO: this should call a function that is debounced and will be used to submit updates to the server (supabase)
  function onUpdate(props: EditorEvents["update"]) {
    const html = props.editor.getHTML();
    const mdx = htmlToMdx(html);
    console.log(mdx);
  }

  return <TiptapEditor initialContent={initialHtml} onUpdate={onUpdate} />;
}
