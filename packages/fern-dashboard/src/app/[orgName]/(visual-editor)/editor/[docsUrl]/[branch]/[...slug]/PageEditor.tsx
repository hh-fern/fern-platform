"use client";

import React, { useImperativeHandle, useRef } from "react";

import { Editor, EditorEvents } from "@tiptap/react";

import { getChangedNodesFromHtml } from "@fern-docs/mdx";

import TiptapEditor from "@/components/editor/TiptapEditor";
import { useMdxState } from "@/providers/MdxStateContext";
import { useOriginalElements } from "@/providers/OriginalElementsContext";

export interface PageEditorRef {
  insertContent: (
    content: string,
    placement?: string,
    newOriginalElements?: any
  ) => void;
  getHTML: () => string;
}

export declare namespace PageEditor {
  export interface Props {
    className?: string;
    filename: string;
    initialHtml?: string;
    ref?: React.Ref<PageEditorRef>;
  }
}

// SEE: https://tiptap.dev/docs/editor/getting-started/install/react
const PageEditor = React.forwardRef<PageEditorRef, PageEditor.Props>(
  ({ className, filename, initialHtml }, ref) => {
    const { stageChanges } = useMdxState();
    const { originalElements } = useOriginalElements();
    const editorRef = useRef<Editor | null>(null);

    // Store the first normalized HTML string from the editor
    const originalTiptapHtml = useRef(initialHtml);
    // Store whether this is the first update from the editor
    // (Kind of a hack to make sure the HTML is normalized by Tiptap before we make it available for comparison)
    const isFirstUpdate = useRef(true);

    useImperativeHandle(ref, () => ({
      insertContent: (
        content: string,
        placement = "cursor",
        overrideOriginalElements?: any
      ) => {
        if (!editorRef.current) return;

        const editor = editorRef.current;
        const htmlBeforeInsertion = editor.getHTML();

        // Debug: Log placement processing
        console.log("PageEditor insertContent Debug:", {
          placement,
          contentPreview: content.substring(0, 100),
        });

        // Parse placement instruction and insert content
        if (placement === "cursor") {
          editor.commands.insertContent(`\n\n${content}`);
        } else if (placement === "end") {
          editor.commands.insertContentAt(
            editor.state.doc.content.size,
            `\n\n${content}`
          );
        } else if (placement === "beginning") {
          editor.commands.insertContentAt(0, `${content}\n\n`);
        } else if (placement.startsWith("after:")) {
          const targetHeading = placement.substring(6);
          insertAfterHeading(editor, targetHeading, content);
        } else if (placement.startsWith("before:")) {
          const targetHeading = placement.substring(7);
          insertBeforeHeading(editor, targetHeading, content);
        } else if (placement.startsWith("replace:")) {
          const targetHeading = placement.substring(8);
          replaceHeadingContent(editor, targetHeading, content);
        } else if (placement.startsWith("append:")) {
          const targetHeading = placement.substring(7);
          appendToHeading(editor, targetHeading, content);
        } else {
          // Fallback to cursor position
          editor.commands.insertContent(`\n\n${content}`);
        }

        // Manually trigger change tracking after AI insertion
        setTimeout(() => {
          const htmlAfterInsertion = editor.getHTML();
          if (
            htmlBeforeInsertion !== htmlAfterInsertion &&
            originalTiptapHtml.current
          ) {
            const changedNodes = getChangedNodesFromHtml(
              originalTiptapHtml.current,
              htmlAfterInsertion
            );
            stageChanges(filename, {
              html: htmlAfterInsertion,
              changedNodes,
              // Use override if provided (for AI insertions), otherwise use current state
              originalElements: overrideOriginalElements || originalElements,
            });
          }
        }, 10); // Small delay to ensure DOM updates are complete
      },
      getHTML: () => {
        return editorRef.current?.getHTML() || "";
      },
    }));

    // Helper function to insert content after a specific heading
    const insertAfterHeading = (
      editor: Editor,
      targetHeading: string,
      content: string
    ) => {
      const doc = editor.state.doc;
      let insertPosition = null;

      doc.descendants((node, pos) => {
        if (
          node.type.name === "heading" &&
          node.textContent.trim() === targetHeading.replace(/^#+\s*/, "")
        ) {
          // Find the end of this heading's section
          const nextPos = pos + node.nodeSize;
          insertPosition = nextPos;
          return false; // Stop searching
        }
        return true;
      });

      if (insertPosition != null) {
        editor.commands.insertContentAt(insertPosition, `\n\n${content}`);
      } else {
        // Fallback: insert at end
        editor.commands.insertContentAt(doc.content.size, `\n\n${content}`);
      }
    };

    // Helper function to insert content before a specific heading
    const insertBeforeHeading = (
      editor: Editor,
      targetHeading: string,
      content: string
    ) => {
      const doc = editor.state.doc;
      let insertPosition = null;

      doc.descendants((node, pos) => {
        if (
          node.type.name === "heading" &&
          node.textContent.trim() === targetHeading.replace(/^#+\s*/, "")
        ) {
          insertPosition = pos;
          return false; // Stop searching
        }
        return true;
      });

      if (insertPosition != null) {
        editor.commands.insertContentAt(insertPosition, `${content}\n\n`);
      } else {
        // Fallback: insert at end
        editor.commands.insertContentAt(doc.content.size, `\n\n${content}`);
      }
    };

    // Helper function to replace content under a heading
    const replaceHeadingContent = (
      editor: Editor,
      targetHeading: string,
      content: string
    ) => {
      // For simplicity, this will append content after the heading
      // A full implementation would need to find and replace the section content
      insertAfterHeading(editor, targetHeading, content);
    };

    // Helper function to append to content under a heading
    const appendToHeading = (
      editor: Editor,
      targetHeading: string,
      content: string
    ) => {
      insertAfterHeading(editor, targetHeading, content);
    };

    function onTiptapEditorCreate(props: EditorEvents["create"]) {
      const latestTiptapHtml = props.editor.getHTML();
      originalTiptapHtml.current = latestTiptapHtml;
      editorRef.current = props.editor;
    }

    function onTiptapEditorUpdate(props: EditorEvents["update"]) {
      const latestTiptapHtml = props.editor.getHTML();
      if (originalTiptapHtml.current && isFirstUpdate.current === false) {
        const changedNodes = getChangedNodesFromHtml(
          originalTiptapHtml.current,
          latestTiptapHtml
        );

        // Always include the current originalElements when staging changes
        // This ensures that custom components maintain their mappings
        stageChanges(filename, {
          html: latestTiptapHtml,
          changedNodes,
          originalElements,
        });
      } else {
        isFirstUpdate.current = false;
      }
    }

    // TODO: add a loading state, possibly as a Suspense boundary
    return (
      initialHtml != null && (
        <TiptapEditor
          className={className}
          content={initialHtml}
          onCreate={onTiptapEditorCreate}
          onUpdate={onTiptapEditorUpdate}
        />
      )
    );
  }
);

PageEditor.displayName = "PageEditor";

export default PageEditor;
