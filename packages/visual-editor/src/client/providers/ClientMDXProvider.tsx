"use client";

import { MDXProvider } from "@mdx-js/react";
import type React from "react";
import { useEffect, useState } from "react";
import { InterceptedChildren } from "@/client/components/editor/editor-component/EditorComponentChildrenContext";

export function ClientMDXProvider({ children }: React.PropsWithChildren) {
    const [editorComponents, setEditorComponents] = useState(() => ({ InterceptedChildren }));

    useEffect(() => {
        import(/* webpackChunkName: "visual-editor-mdx-components" */ "@/client/docs/mdx/components").then(
            ({ MDX_COMPONENTS }) => {
                setEditorComponents({
                    ...MDX_COMPONENTS,
                    InterceptedChildren
                });
            }
        );
    }, []);

    return <MDXProvider components={editorComponents}>{children}</MDXProvider>;
}
