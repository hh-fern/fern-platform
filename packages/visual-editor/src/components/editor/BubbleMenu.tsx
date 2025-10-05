import { useCurrentEditor } from "@tiptap/react";
import { BubbleMenu as EditorBubbleMenu } from "@tiptap/react/menus";
import type { MouseEventHandler } from "react";

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

export interface BubbleMenuProps {
    Icon?: React.ComponentType<any>;
}

export default function BubbleMenu({ Icon }: BubbleMenuProps) {
    const { editor } = useCurrentEditor();

    function menuItemClickHandler(action: BubbleMenuAction) {
        return () => {
            if (!editor) {
                return;
            }

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
                    editor.chain().focus().setLink({ href: "https://www.google.com" }).run();
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

    // Render simplified version if Icon component not provided
    if (!Icon) {
        return (
            <EditorBubbleMenu
                options={{ placement: "top-start" }}
                shouldShow={({ editor: { isFocused }, state: { selection } }) => {
                    // Don't show the bubble menu if the selection is an image or image upload
                    if (
                        // @ts-expect-error - type issue with tiptap
                        selection?.node?.type?.name === "custom-element-v2" ||
                        // @ts-expect-error - type issue with tiptap
                        selection?.node?.type?.name === "mediaUpload"
                    ) {
                        return false;
                    }

                    // Check if we have an active selection
                    return isFocused && !selection.empty;
                }}
            >
                <div className="border-1 rounded-2 text-gray-1100 flex items-center gap-px border-gray-500 bg-white p-1 shadow-sm">
                    <button
                        className="rounded-1 cursor-pointer p-1 transition-colors hover:bg-gray-300 hover:transition-none"
                        onClick={menuItemClickHandler("setNodeType")}
                    >
                        H
                    </button>
                    <button
                        className="rounded-1 cursor-pointer p-1 transition-colors hover:bg-gray-300 hover:transition-none"
                        onClick={menuItemClickHandler("toggleBold")}
                    >
                        <strong>B</strong>
                    </button>
                    <button
                        className="rounded-1 cursor-pointer p-1 transition-colors hover:bg-gray-300 hover:transition-none"
                        onClick={menuItemClickHandler("toggleItalic")}
                    >
                        <em>I</em>
                    </button>
                </div>
            </EditorBubbleMenu>
        );
    }

    return (
        <EditorBubbleMenu
            options={{ placement: "top-start" }}
            shouldShow={({ editor: { isFocused }, state: { selection } }) => {
                // Don't show the bubble menu if the selection is an image or image upload
                if (
                    // @ts-expect-error - type issue with tiptap
                    selection?.node?.type?.name === "custom-element-v2" ||
                    // @ts-expect-error - type issue with tiptap
                    selection?.node?.type?.name === "mediaUpload"
                ) {
                    return false;
                }

                // Check if we have an active selection
                return isFocused && !selection.empty;
            }}
        >
            <div className="border-1 rounded-2 text-gray-1100 flex items-center gap-px border-gray-500 bg-white p-1 shadow-sm">
                <BubbleMenuItem
                    Icon={Icon}
                    iconProps={{ variant: "Heading1" }}
                    onClick={menuItemClickHandler("setNodeType")}
                />
                <BubbleMenuSeparator />
                <BubbleMenuItem
                    Icon={Icon}
                    iconProps={{ variant: "Bold" }}
                    onClick={menuItemClickHandler("toggleBold")}
                />
                <BubbleMenuItem
                    Icon={Icon}
                    iconProps={{ variant: "Italic" }}
                    onClick={menuItemClickHandler("toggleItalic")}
                />
                <BubbleMenuItem
                    Icon={Icon}
                    iconProps={{ variant: "Underline" }}
                    onClick={menuItemClickHandler("toggleUnderline")}
                />
                {/* 
        TODO: Add strikethrough
        <BubbleMenuItem
          Icon={Icon}
          iconProps={{ variant: "Strikethrough" }}
          onClick={menuItemClickHandler("toggleStrike")}
        /> */}
                {/*
        TODO: Add link
         <BubbleMenuItem
          Icon={Icon}
          iconProps={{ variant: "Link" }}
          onClick={menuItemClickHandler("setLink")}
        /> */}
                <BubbleMenuItem
                    Icon={Icon}
                    iconProps={{ variant: "Code" }}
                    onClick={menuItemClickHandler("toggleCode")}
                />
                <BubbleMenuSeparator />
                <BubbleMenuItem
                    Icon={Icon}
                    iconProps={{ variant: "List" }}
                    onClick={menuItemClickHandler("toggleBulletList")}
                />
                <BubbleMenuItem
                    Icon={Icon}
                    iconProps={{ variant: "ListOrdered" }}
                    onClick={menuItemClickHandler("toggleOrderedList")}
                />
            </div>
        </EditorBubbleMenu>
    );
}

interface BubbleMenuItemProps {
    Icon?: React.ComponentType<any>;
    iconProps: any;
    onClick?: MouseEventHandler<HTMLButtonElement>;
}

function BubbleMenuItem({ Icon, iconProps, onClick }: BubbleMenuItemProps) {
    const { size = 20, ...restIconProps } = iconProps;

    if (!Icon) {
        return (
            <button
                className="rounded-1 cursor-pointer p-1 transition-colors hover:bg-gray-300 hover:transition-none"
                onClick={onClick}
                onMouseDown={(e) => e.preventDefault()}
            >
                <div className="flex size-6 items-center justify-center">{iconProps.variant}</div>
            </button>
        );
    }

    return (
        <button
            className="rounded-1 cursor-pointer p-1 transition-colors hover:bg-gray-300 hover:transition-none"
            onClick={onClick}
            onMouseDown={(e) => e.preventDefault()}
        >
            <div className="flex size-6 items-center justify-center">
                <Icon size={size} {...restIconProps} />
            </div>
        </button>
    );
}

function BubbleMenuSeparator() {
    return (
        <div className="flex h-6 w-1.5 items-center justify-center">
            <div className="h-5 w-px bg-gray-300" />
        </div>
    );
}
