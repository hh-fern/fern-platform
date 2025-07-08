"use client";

import React from "react";

import { EditorEvents } from "@tiptap/react";

import TiptapEditor from "@/components/editor/TiptapEditor";

import { stageChanges } from "./actions";

export declare namespace PageEditor {
  export interface Props {
    className?: string;
    fileName: string;
    initialHtml?: string;
  }
}

// SEE: https://tiptap.dev/docs/editor/getting-started/install/react
export default function PageEditor({
  className,
  fileName,
  initialHtml,
}: PageEditor.Props) {
  // const memoStageChanges = useCallback(
  //   async (fileName: string, dependencies: any) => {

  //   },
  //   []
  // );

  function onTiptapEditorUpdate(props: EditorEvents["update"]) {
    const html = props.editor.getHTML();
    // stageChanges(fileName, { html });
    void stageChanges(fileName, { html });
  }

  // TODO: add a loading state, possibly as a Suspense boundary
  return (
    initialHtml != null && (
      <TiptapEditor
        className={className}
        content={initialHtml}
        onUpdate={onTiptapEditorUpdate}
      />
    )
  );
}
