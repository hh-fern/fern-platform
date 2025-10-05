"use client";

import CodeBlock from "@tiptap/extension-code-block";
import Placeholder from "@tiptap/extension-placeholder";
import {
    EditorProvider,
    type EditorProviderProps,
    type Extension,
    ReactNodeViewRenderer,
    useCurrentEditor
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { createLowlight } from "lowlight";
import { useEffect } from "react";

import { createCodeBlockComponent } from "./extension-code-block/CodeBlockComponent";
import type { LowlightInstance } from "./extension-code-block/types";
import { CustomElement } from "./extension-custom-element/custom-element";
import { FVEAttributesExtension } from "./extension-fve-attributes";
import FloatingMenu from "./FloatingMenu";
import NodeHoverHandle from "./NodeHoverHandle";
import { LowlightPlugin } from "./tiptap-node/lowlight/lowlight-plugin";

// We'll need to lazy-load the lowlight instance to avoid importing all the lowlight package dependencies, so
// this is just an empty instance
const lowlight: LowlightInstance = createLowlight();

// These node types are the ones that will have data attributes set on them
const dataAttributeNodeTypes = [
    "div",
    "img",
    "doc",
    "paragraph",
    "heading",
    "blockquote",
    "codeBlock",
    "hardBreak",
    "horizontalRule",
    "bulletList",
    "orderedList",
    "listItem"
];

export interface TiptapEditorProps {
    autofocus?: boolean;
    className?: string;
    disableDragging?: boolean;
    initialContent: string;
    onCreate?: EditorProviderProps["onCreate"];
    onUpdate?: EditorProviderProps["onUpdate"];
    // Optional configuration
    configuredMediaUploadNode?: Extension;
    configuredFileHandler?: Extension;
    isEditingDisabled?: boolean;
    // Optional components
    NodeHoverHandle?: React.ComponentType;
    FloatingMenu?: React.ComponentType;
    BubbleMenu?: React.ComponentType;
    // EditorContext utilities
    setEditor?: (editor: any) => void;
    cn?: (...classes: any[]) => string;
}

// Configure Tiptap extensions
const createExtensions = (configuredMediaUploadNode?: Extension, configuredFileHandler?: Extension): Extension[] => {
    const baseExtensions = [
        StarterKit.configure({
            dropcursor: {
                color: "var(--grayscale-a11)"
            },
            gapcursor: false,
            codeBlock: false
        }),
        FVEAttributesExtension.configure({
            types: dataAttributeNodeTypes
        }),
        CustomElement,
        Placeholder.configure({
            placeholder: "Write or press `/` for components",
            emptyEditorClass: "is-empty",
            emptyNodeClass: "is-empty"
        }),
        CodeBlock.configure({ enableTabIndentation: true }).extend({
            addNodeView() {
                return ReactNodeViewRenderer(createCodeBlockComponent(lowlight));
            },
            addProseMirrorPlugins() {
                return [LowlightPlugin({ name: "codeBlock", lowlight, defaultLanguage: null })];
            }
        })
    ] as Extension[];

    // Add optional extensions if provided
    if (configuredMediaUploadNode) {
        baseExtensions.push(configuredMediaUploadNode);
    }
    if (configuredFileHandler) {
        baseExtensions.push(configuredFileHandler);
    }

    return baseExtensions;
};

// SEE: https://tiptap.dev/docs/editor/getting-started/install/react
export function TiptapEditor({
    autofocus,
    className,
    initialContent,
    onCreate,
    onUpdate,
    disableDragging,
    configuredMediaUploadNode,
    configuredFileHandler,
    isEditingDisabled = false,
    NodeHoverHandle,
    FloatingMenu,
    BubbleMenu,
    setEditor,
    cn
}: TiptapEditorProps) {
    const classNameValue = cn ? cn(className, "relative") : `${className || ""} relative`.trim();

    return (
        <EditorProvider
            autofocus={autofocus}
            extensions={createExtensions(configuredMediaUploadNode, configuredFileHandler)}
            editorProps={{
                attributes: {
                    class: "prose prose-md focus:outline-none max-w-none p-4 prose-inherit-colors"
                }
            }}
            parseOptions={{
                // Required to preserve formatting in custom element previews
                preserveWhitespace: true
            }}
            content={initialContent}
            editorContainerProps={{
                className: classNameValue
            }}
            immediatelyRender={false}
            onCreate={onCreate}
            onUpdate={onUpdate}
            onFocus={({ editor }) => {
                // Clear selection from all other ProseMirror editors when this editor is focused
                const allEditors = document.querySelectorAll(".ProseMirror");
                allEditors.forEach((editorElement) => {
                    if (editorElement !== editor.view.dom) {
                        // Clear selection by removing ProseMirror-selectednode class from all nodes in other editors
                        const selectedNodes = editorElement.querySelectorAll(".ProseMirror-selectednode");
                        selectedNodes.forEach((node) => {
                            node.classList.remove("ProseMirror-selectednode");
                        });
                    }
                });
            }}
        >
            <div>
                {/* DEV NOTE: The floating menu and bubble menu MUST be rendered before the editor content to reconcile
        a dom bug with tiptap's floating menus.
        Context here: https://github.com/ueberdosis/tiptap/issues/4619#issuecomment-1869042861 */}
                {!isEditingDisabled && !disableDragging && NodeHoverHandle && <NodeHoverHandle />}
                {!isEditingDisabled && FloatingMenu && <FloatingMenu />}
                {!isEditingDisabled && BubbleMenu && <BubbleMenu />}
            </div>
            {setEditor && <EditorContextUpdater setEditor={setEditor} />}
            <TipTapEditingDisabledListener isEditingDisabled={isEditingDisabled} />
        </EditorProvider>
    );
}

function EditorContextUpdater({ setEditor }: { setEditor: (editor: any) => void }) {
    const { editor } = useCurrentEditor();

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

function TipTapEditingDisabledListener({ isEditingDisabled }: { isEditingDisabled: boolean }) {
    const { editor } = useCurrentEditor();

    // Ensure the editor stays in sync with editability status
    useEffect(() => {
        if (isEditingDisabled) {
            editor?.setEditable(false, false);
        } else {
            editor?.setEditable(true, false);
        }
    }, [isEditingDisabled, editor]);

    return <></>;
}

export default TiptapEditor;
