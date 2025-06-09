"use client";

import { MouseEventHandler } from "react";

import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import {
  EditorProvider,
  EditorProviderProps,
  useCurrentEditor,
} from "@tiptap/react";
import { BubbleMenu, FloatingMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";

import { Icon } from "../icon/Icon";

// Configure Tiptap extensions
const extensions = [StarterKit, Link, Underline];

export declare namespace TiptapEditor {
  export interface Props {
    className?: string;
    disableFloatingMenu?: boolean;
    disableBubbleMenu?: boolean;
    content?: EditorProviderProps["content"];
    onUpdate?: EditorProviderProps["onUpdate"];
  }
}

// SEE: https://tiptap.dev/docs/editor/getting-started/install/react
export default function TiptapEditor({
  className,
  disableFloatingMenu,
  disableBubbleMenu,
  content,
  onUpdate,
}: TiptapEditor.Props) {
  return (
    <EditorProvider
      extensions={extensions}
      content={content}
      editorProps={{
        attributes: {
          class: "prose prose-md m-5 focus:outline-none",
        },
      }}
      editorContainerProps={{ className }}
      immediatelyRender={false}
      onUpdate={onUpdate}
    >
      {!disableFloatingMenu && <EditorFloatingMenu />}
      {!disableBubbleMenu && <EditorBubbleMenu />}
    </EditorProvider>
  );
}

type FloatingMenuAction =
  | "toggleHeading1"
  | "toggleHeading2"
  | "toggleHeading3"
  | "toggleBulletList"
  | "toggleOrderedList"
  | "toggleQuote"
  | "setLink";

function EditorFloatingMenu() {
  const { editor } = useCurrentEditor();

  function menuItemClickHandler(action: FloatingMenuAction) {
    return () => {
      if (!editor) return;

      switch (action) {
        case "toggleHeading1":
          editor.chain().focus().toggleHeading({ level: 1 }).run();
          break;
        case "toggleHeading2":
          editor.chain().focus().toggleHeading({ level: 2 }).run();
          break;
        case "toggleHeading3":
          editor.chain().focus().toggleHeading({ level: 3 }).run();
          break;
        case "toggleBulletList":
          editor.chain().focus().toggleBulletList().run();
          break;
        case "toggleOrderedList":
          editor.chain().focus().toggleOrderedList().run();
          break;
        case "toggleQuote":
          editor.chain().focus().toggleBlockquote().run();
          break;
        case "setLink":
          // TODO: This should open an additional popover to edit the link
          editor
            .chain()
            .focus()
            .setLink({ href: "https://www.google.com" })
            .run();
          break;
      }
    };
  }

  return (
    <FloatingMenu
      editor={null}
      options={{ placement: "bottom-start" }}
      shouldShow={({ editor, state }) => {
        const { selection } = state;
        const { $from } = selection;

        // Check if we're at the start of an empty paragraph
        return (
          editor.isFocused &&
          selection.empty &&
          $from.parent.type.name === "paragraph" &&
          $from.parent.textContent === "" &&
          $from.parentOffset === 0
        );
      }}
    >
      <div className="border-1 text-gray-1100 flex min-w-60 flex-col border-gray-500 bg-white p-2 shadow-sm">
        <FloatingMenuHeading title="Basics" />
        <FloatingMenuItem title="Text" iconProps={{ variant: "Type" }} />
        <FloatingMenuItem
          title="Heading 1"
          iconProps={{ variant: "Heading1" }}
          onClick={menuItemClickHandler("toggleHeading1")}
        />
        <FloatingMenuItem
          title="Heading 2"
          iconProps={{ variant: "Heading2" }}
          onClick={menuItemClickHandler("toggleHeading2")}
        />
        <FloatingMenuItem
          title="Heading 3"
          iconProps={{ variant: "Heading3" }}
          onClick={menuItemClickHandler("toggleHeading3")}
        />
        <FloatingMenuItem
          title="Bulleted list"
          iconProps={{ variant: "List" }}
          onClick={menuItemClickHandler("toggleBulletList")}
        />
        <FloatingMenuItem
          title="Numbered list"
          iconProps={{ variant: "ListOrdered" }}
          onClick={menuItemClickHandler("toggleOrderedList")}
        />
        <FloatingMenuItem
          title="Quote"
          iconProps={{ variant: "MessageSquareQuote" }}
          onClick={menuItemClickHandler("toggleQuote")}
        />
        <FloatingMenuItem
          title="Link"
          iconProps={{ variant: "Link" }}
          onClick={menuItemClickHandler("setLink")}
        />
      </div>
    </FloatingMenu>
  );
}

declare namespace FloatingMenuHeading {
  export interface Props {
    title: string;
  }
}

function FloatingMenuHeading({ title }: FloatingMenuHeading.Props) {
  return (
    <div className="px-2 pb-2 pt-1 text-sm font-bold uppercase text-gray-800">
      {title}
    </div>
  );
}

declare namespace FloatingMenuItem {
  export interface Props {
    title: string;
    iconProps: Icon.Props;
    onClick?: MouseEventHandler<HTMLButtonElement>;
  }
}

function FloatingMenuItem({
  title,
  iconProps,
  onClick,
}: FloatingMenuItem.Props) {
  const { size = 20, ...restIconProps } = iconProps;

  return (
    <button
      className="flex h-8 cursor-pointer items-center gap-2 px-2 hover:bg-gray-500"
      onClick={onClick}
    >
      <div className="flex size-4 items-center justify-center">
        <Icon size={size} {...restIconProps} />
      </div>
      <div className="text-md font-medium">{title}</div>
    </button>
  );
}

type BubbleMenuAction =
  | "setNodeType"
  | "toggleBold"
  | "toggleItalic"
  | "toggleUnderline"
  | "toggleStrike"
  | "setLink"
  | "toggleCode"
  | "toggleBulletList"
  | "toggleOrderedList";

function EditorBubbleMenu() {
  const { editor } = useCurrentEditor();

  function menuItemClickHandler(action: BubbleMenuAction) {
    return () => {
      if (!editor) return;

      switch (action) {
        case "setNodeType":
          // TODO: This should open an additional popover to select the heading level
          editor.chain().focus().toggleHeading({ level: 1 }).run();
          break;
        case "toggleBold":
          editor.chain().focus().toggleBold().run();
          break;
        case "toggleItalic":
          editor.chain().focus().toggleItalic().run();
          break;
        case "toggleUnderline":
          editor.chain().focus().toggleUnderline().run();
          break;
        case "toggleStrike":
          editor.chain().focus().toggleStrike().run();
          break;
        case "setLink":
          // TODO: This should open an additional popover to edit the link
          editor
            .chain()
            .focus()
            .setLink({ href: "https://www.google.com" })
            .run();
          break;
        case "toggleCode":
          editor.chain().focus().toggleCode().run();
          break;
        case "toggleBulletList":
          editor.chain().focus().toggleBulletList().run();
          break;
        case "toggleOrderedList":
          editor.chain().focus().toggleOrderedList().run();
          break;
      }
    };
  }

  return (
    <BubbleMenu
      options={{ placement: "top-start" }}
      shouldShow={({ editor, state }) => {
        const { selection } = state;

        // Check if we have an active selection
        return editor.isFocused && !selection.empty;
      }}
    >
      <div className="border-1 text-gray-1100 flex items-center gap-1 border-gray-500 bg-white p-2 shadow-sm">
        <BubbleMenuItem
          iconProps={{ variant: "Heading1" }}
          onClick={menuItemClickHandler("setNodeType")}
        />
        <BubbleMenuSeparator />
        <BubbleMenuItem
          iconProps={{ variant: "Bold" }}
          onClick={menuItemClickHandler("toggleBold")}
        />
        <BubbleMenuItem
          iconProps={{ variant: "Italic" }}
          onClick={menuItemClickHandler("toggleItalic")}
        />
        <BubbleMenuItem
          iconProps={{ variant: "Underline" }}
          onClick={menuItemClickHandler("toggleUnderline")}
        />
        <BubbleMenuItem
          iconProps={{ variant: "Strikethrough" }}
          onClick={menuItemClickHandler("toggleStrike")}
        />
        <BubbleMenuItem
          iconProps={{ variant: "Link" }}
          onClick={menuItemClickHandler("setLink")}
        />
        <BubbleMenuItem
          iconProps={{ variant: "Code" }}
          onClick={menuItemClickHandler("toggleCode")}
        />
        <BubbleMenuSeparator />
        <BubbleMenuItem
          iconProps={{ variant: "List" }}
          onClick={menuItemClickHandler("toggleBulletList")}
        />
        <BubbleMenuItem
          iconProps={{ variant: "ListOrdered" }}
          onClick={menuItemClickHandler("toggleOrderedList")}
        />
      </div>
    </BubbleMenu>
  );
}

declare namespace BubbleMenuItem {
  export interface Props {
    iconProps: Icon.Props;
    onClick?: MouseEventHandler<HTMLButtonElement>;
  }
}

function BubbleMenuItem({ iconProps, onClick }: BubbleMenuItem.Props) {
  const { size = 20, ...restIconProps } = iconProps;

  return (
    <button className="cursor-pointer hover:bg-gray-500" onClick={onClick}>
      <div className="flex size-6 items-center justify-center">
        <Icon size={size} {...restIconProps} />
      </div>
    </button>
  );
}

function BubbleMenuSeparator() {
  return (
    <div className="flex h-6 w-1 items-center justify-center">
      <div className="h-5 w-px bg-gray-300" />
    </div>
  );
}
