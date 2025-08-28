"use client";

import { useEffect, useRef } from "react";

import { Image } from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import UniqueID from "@tiptap/extension-unique-id";
import {
  EditorProvider,
  EditorProviderProps,
  Extension,
  useCurrentEditor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import { DashboardApiClient } from "@/app/services/dashboard-api/client";
import "@/components/editor/tiptap-node/image-node/image-node.scss";
import { useEditingDisabled } from "@/hooks/useEditingDisabled";
import { useEditor } from "@/providers/EditorContext";

import BubbleMenu from "./BubbleMenu";
import { ErrorUploadImageToast } from "./EditorToasts";
import FloatingMenu from "./FloatingMenu";
import NodeHoverHandle from "./NodeHoverHandle";
import CustomElement from "./extension-custom-element";
import GlobalDataHashAttribute from "./extension-global-data-hash-attribute";
import { ImageUploadNode } from "./tiptap-node/image-upload-node";

// These node types are the ones that will have data attributes set on them
const dataAttributeNodeTypes = [
  "doc",
  "paragraph",
  "heading",
  "blockquote",
  "codeBlock",
  "hardBreak",
  "horizontalRule",
  "bulletList",
  "orderedList",
  "listItem",
];

// Configure Tiptap extensions
const extensions = [
  StarterKit,
  CustomElement,
  Image.extend({
    renderHTML({ HTMLAttributes }) {
      return ["img", HTMLAttributes];
    },
  }),
  ImageUploadNode.configure({
    accept: "image/*",
    maxSize: 1024 * 1024 * 5, // 5MB
    limit: 1,
    upload: async (
      file: File,
      onProgress?: (event: { progress: number }) => void,
      signal?: AbortSignal
    ) => {
      try {
        onProgress?.({ progress: 20 });

        // Get pre-signed URL from our API
        const response = await DashboardApiClient.generateSignedUploadUrl({
          fileName: file.name,
          contentType: file.type,
          docsUrl: "visual-editor-test.docs.buildwithfern.com", // TODO
          slug: "test/slug", // TODO
        });
        onProgress?.({ progress: 90 });

        // Upload file directly to S3 using pre-signed URL (avoids excess server load)
        const uploadResponse = await fetch(response.uploadUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
          },
          signal,
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error("S3 upload failed:", {
            status: uploadResponse.status,
            statusText: uploadResponse.statusText,
            errorText,
          });
          throw new Error(
            `Failed to upload file: ${uploadResponse.status} ${uploadResponse.statusText}. ${errorText}`
          );
        }

        // Report progress as completed
        onProgress?.({ progress: 100 });

        return response.imageUrl;
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error("Upload failed");
      }
    },
    onError: (error) => ErrorUploadImageToast(error),
  }),
  UniqueID.configure({
    types: dataAttributeNodeTypes,
  }),
  GlobalDataHashAttribute.configure({
    types: dataAttributeNodeTypes,
  }),
  Placeholder.configure({
    placeholder: "Write or press `/` for components",
    emptyEditorClass: "is-empty",
    emptyNodeClass: "is-empty",
  }),
] as Extension[];
export declare namespace TiptapEditor {
  export interface Props {
    autofocus?: boolean;
    className?: string;
    disableFloatingMenu?: boolean;
    disableBubbleMenu?: boolean;
    content?: EditorProviderProps["content"];
    onCreate?: EditorProviderProps["onCreate"];
    onUpdate?: EditorProviderProps["onUpdate"];
  }
}

// SEE: https://tiptap.dev/docs/editor/getting-started/install/react
export default function TiptapEditor({
  autofocus,
  className,
  disableFloatingMenu,
  disableBubbleMenu,
  content,
  onCreate,
  onUpdate,
}: TiptapEditor.Props) {
  const isEditingDisabled = useEditingDisabled();

  return (
    <EditorProvider
      autofocus={autofocus}
      extensions={extensions}
      content={content}
      editorProps={{
        attributes: {
          class: "prose prose-md p-7 -m-2 focus:outline-none max-w-none",
        },
      }}
      parseOptions={{
        // Required to preserve formatting in custom element previews
        preserveWhitespace: true,
      }}
      editorContainerProps={{ className }}
      immediatelyRender={false}
      onCreate={onCreate}
      onUpdate={onUpdate}
    >
      <EditorContextUpdater />
      <TipTapContentUpdateListener content={content} />
      {!disableFloatingMenu && !isEditingDisabled && <FloatingMenu />}
      {!disableBubbleMenu && !isEditingDisabled && <BubbleMenu />}
      <NodeHoverHandle />
    </EditorProvider>
  );
}

function EditorContextUpdater() {
  const { editor } = useCurrentEditor();
  const { setEditor } = useEditor();

  // Update the shared editor context when the Tiptap editor instance changes
  useEffect(() => {
    setEditor(editor);

    // Cleanup when component unmounts or editor changes
    return () => {
      setEditor(null);
    };
  }, [editor, setEditor]);

  return <></>;
}

function TipTapContentUpdateListener({
  content,
}: {
  content: EditorProviderProps["content"];
}) {
  const { editor } = useCurrentEditor();
  const isEditingDisabled = useEditingDisabled();
  const lastSetContentRef = useRef<string | null>(null);

  // Ensure the editor stays in sync with editability status
  useEffect(() => {
    if (isEditingDisabled) {
      editor?.setEditable(false, false);
    } else {
      editor?.setEditable(true, false);
    }
  }, [isEditingDisabled, editor]);

  // Monitor content changes and update editor imperatively when needed
  useEffect(() => {
    if (!editor || isEditingDisabled) return;

    // Don't update if the editor is focused (user is typing)
    if (editor.isFocused) return;
    const contentStr =
      typeof content === "string" ? content : JSON.stringify(content);

    if (!contentStr) return;

    const currContent = editor.getHTML();

    // Don't update if this content was the last thing we set
    // This prevents infinite loops when user types in editor
    if (lastSetContentRef.current === contentStr) {
      return;
    }

    if (contentStr !== currContent) {
      lastSetContentRef.current = contentStr;
      editor.commands.setContent(contentStr, {
        emitUpdate: false, // Don't emit update events since we don't want to trigger the onUpdate callback
      });
    }
  }, [content, editor, isEditingDisabled]);

  return <></>;
}
