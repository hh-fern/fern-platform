"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const DocsPage = dynamic(
    () => import(/* webpackChunkName: "visual-editor-docs-page" */ "./docs-page").then((mod) => mod.DocsPage),
    { ssr: false }
);

export function LazyDocsPage(props: ComponentProps<typeof DocsPage>) {
    return <DocsPage {...props} />;
}
