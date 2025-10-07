"use client";

import type { SerializableFoundNode } from "@fern-docs/components/navigation";
import { AbstractLayoutEvaluatorContent } from "@fern-docs/components/layouts/AbstractLayoutEvaluatorContent";

import { TableOfContentsProvider, useTableOfContents } from "@/providers/TableOfContentsContext";
import PageNode from "./PageNode";

interface PageWithTocProps {
    pageDataDeps: any;
    fallbackFoundNode?: SerializableFoundNode;
    cssConfig?: { inline?: string[] };
}

function PageContent({ pageDataDeps, fallbackFoundNode, cssConfig }: PageWithTocProps) {
    const { tableOfContents } = useTableOfContents();

    return (
        <AbstractLayoutEvaluatorContent tableOfContents={tableOfContents} frontmatter={undefined}>
            <div className="flex w-full flex-col gap-2 py-12">
                <PageNode pageDataDeps={pageDataDeps} fallbackFoundNode={fallbackFoundNode} cssConfig={cssConfig} />
            </div>
        </AbstractLayoutEvaluatorContent>
    );
}

export default function PageWithToc(props: PageWithTocProps) {
    return (
        <TableOfContentsProvider>
            <PageContent {...props} />
        </TableOfContentsProvider>
    );
}
