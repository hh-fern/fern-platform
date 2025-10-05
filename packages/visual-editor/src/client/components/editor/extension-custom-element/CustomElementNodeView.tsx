"use client";

import { type NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import type React from "react";
import { useCallback, useEffect } from "react";

export interface CustomElementNodeViewProps extends NodeViewProps {
    FernEditorMDXRenderer?: React.ComponentType<{
        mdx: string;
        onUpdate: (mdx: string) => void;
        newlyCreated?: boolean;
        docsUrl?: string;
        branch?: string;
    }>;
    ErrorBoundary?: React.ComponentType<{
        fallback: React.ReactNode;
        children: React.ReactNode;
    }>;
    UnsupportedContent?: React.ComponentType<{ children: React.ReactNode }>;
    docsUrl?: string;
    branch?: string;
}

export const CustomElementNodeView = (props: CustomElementNodeViewProps) => {
    const {
        node,
        updateAttributes,
        editor,
        getPos,
        FernEditorMDXRenderer,
        ErrorBoundary,
        UnsupportedContent,
        docsUrl,
        branch
    } = props;
    const { attrs } = node;

    // Get the MDX content from the node attributes
    const mdxb64 = attrs["fve-mdx-b64"];
    const newlyCreated = attrs["fve-newly-created"];
    const mdx = Buffer.from(mdxb64, "base64").toString("utf-8");

    // Delete the node when mdxb64 becomes empty
    const handleDelete = useCallback(() => {
        const pos = getPos();
        if (typeof pos === "number") {
            editor
                .chain()
                .focus()
                .deleteRange({ from: pos, to: pos + node.nodeSize })
                .run();
        }
    }, [getPos, editor, node.nodeSize]);

    // Monitor mdxb64 and delete node if it becomes empty
    // This happens when a user deletes the element via a popover.
    // It's sort of hacky, but the delete function just sets the mdx content to "".
    useEffect(() => {
        if (!mdxb64 || mdxb64.trim() === "") {
            handleDelete();
        }
    }, [mdxb64, handleDelete]);

    const handleUpdate = (updatedMdx: string) => {
        updateAttributes({
            "fve-mdx-b64": Buffer.from(updatedMdx).toString("base64"),
            "fve-newly-created": false
        });
    };

    // If required components are not provided, render basic fallback
    if (!FernEditorMDXRenderer || !ErrorBoundary || !UnsupportedContent) {
        return (
            <NodeViewWrapper>
                <div className="p-4 border border-gray-300 rounded">
                    <pre className="text-xs overflow-auto">{mdx}</pre>
                </div>
            </NodeViewWrapper>
        );
    }

    return (
        <ErrorBoundary
            fallback={
                <NodeViewWrapper>
                    <UnsupportedContent>{mdx}</UnsupportedContent>
                </NodeViewWrapper>
            }
        >
            <NodeViewWrapper>
                <FernEditorMDXRenderer
                    mdx={mdx}
                    onUpdate={handleUpdate}
                    newlyCreated={newlyCreated}
                    docsUrl={docsUrl}
                    branch={branch}
                />
            </NodeViewWrapper>
        </ErrorBoundary>
    );
};
