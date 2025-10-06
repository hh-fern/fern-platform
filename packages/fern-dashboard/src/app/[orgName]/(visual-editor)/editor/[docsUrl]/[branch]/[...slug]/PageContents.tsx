"use client";

import type { NodeId } from "@fern-api/fdr-sdk/navigation";
import { usePages } from "@fern-dashboard/visual-editor/client/providers/PagesStoreContext";
import type { MdxToHtmlResponse } from "@fern-docs/mdx";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useCurrentPage } from "@/providers/CurrentPageContext";
import PageSubtitle from "./PageSubtitle";
import PageTitle from "./PageTitle";

const PageEditor = dynamic(
    () =>
        import(
            /* webpackChunkName: "visual-editor-page-editor" */
            "@fern-dashboard/visual-editor/client/components/editor/PageEditor"
        ).then((mod) => mod.PageEditor),
    { ssr: false }
);

export declare namespace PageContents {
    export interface Props {
        filename: string;
        initialHtml: MdxToHtmlResponse["html"];
        initialFrontmatter: MdxToHtmlResponse["frontmatter"];
        initialOriginalFrontmatter: MdxToHtmlResponse["originalFrontmatter"];
        clientNodeId?: NodeId;
    }
}

export default function PageContents({
    filename,
    initialHtml,
    initialFrontmatter,
    initialOriginalFrontmatter,
    clientNodeId
}: PageContents.Props) {
    const { title, subtitle } = initialFrontmatter ?? {};

    const { setCurrentFilename } = useCurrentPage();
    const { initializePage } = usePages();

    useEffect(() => {
        // Set this as the current active page
        setCurrentFilename(filename);

        // Initialize page with initial server data in the store
        // PagesStore handles duplicate prevention internally
        initializePage(filename, clientNodeId, initialHtml, initialFrontmatter, initialOriginalFrontmatter);
    }, [
        filename,
        clientNodeId,
        initialHtml,
        initialFrontmatter,
        initialOriginalFrontmatter,
        initializePage,
        setCurrentFilename
    ]);

    return (
        <div className="max-w-content-width-wide mx-auto w-full pb-64">
            <PageTitle className="w-full" filename={filename} initialText={title ? String(title) : undefined} />
            <PageSubtitle
                className="w-full"
                filename={filename}
                initialText={subtitle ? String(subtitle) : undefined}
            />
            <PageEditor className="-m-2 w-full p-3" filename={filename} initialHtml={initialHtml} />
        </div>
    );
}
