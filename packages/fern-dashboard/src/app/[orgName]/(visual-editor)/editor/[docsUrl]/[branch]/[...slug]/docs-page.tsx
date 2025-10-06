"use client";

import type { DangerousTransmittableDocsLoaderData } from "@fern-api/docs-loader";
import type { AuthState } from "@fern-api/docs-server";
import type { FernColorTheme } from "@fern-api/docs-utils";
import type { FileData } from "@fern-api/docs-utils/types/file-data";
import type { FernLayoutConfig } from "@fern-api/docs-utils/types/layout-config";
import type { Frontmatter } from "@fern-api/fdr-sdk/docs";
import type { NodeId, RootNode, Slug, utils } from "@fern-api/fdr-sdk/navigation";
import { AbstractLayoutEvaluatorContent } from "@fern-docs/components/layouts/AbstractLayoutEvaluatorContent";
import type { SerializableFoundNode } from "@fern-docs/components/navigation/types";
import { DocsLayout } from "./docs-layout";
import PageNode from "./PageNode";

export function DocsPage({
    domain,
    config,
    slug,
    root,
    basePath,
    files,
    frontmatter,
    colors,
    layout,
    authState,
    prefetchedLoaderData,
    isAuthenticatedPagesDiscoverable,
    showSearchBarInHeaderTabs,
    hasProductsOrVersions,
    foundNode,
    clientNodeId,
    filename,
    html,
    cssConfig,
    originalFrontmatter
}: {
    domain: string;
    config: any;
    slug: Slug;
    root: RootNode;
    basePath: string;
    files: Record<string, FileData>;
    frontmatter: Record<string, any> | undefined;
    colors: {
        light?: FernColorTheme;
        dark?: FernColorTheme;
    };
    layout: FernLayoutConfig;
    authState: AuthState;
    prefetchedLoaderData: DangerousTransmittableDocsLoaderData;
    isAuthenticatedPagesDiscoverable: boolean;
    showSearchBarInHeaderTabs: boolean;
    hasProductsOrVersions: boolean;
    foundNode: SerializableFoundNode | undefined;
    clientNodeId: NodeId;
    filename: string | undefined;
    html: string | undefined;
    cssConfig: { inline?: string[] };
    originalFrontmatter: string | undefined;
}) {
    return (
        // TODO: Currently, we are force-hiding the table of contents is within Visual Editor.
        // This is a temporary solution, as I anticipate we will want the TOC to be dynamic based
        // on the tiptap editor's content.
        <DocsLayout
            domain={domain}
            config={config}
            slug={slug}
            root={root}
            basePath={basePath}
            files={files}
            frontmatter={frontmatter as Frontmatter | undefined}
            colors={colors}
            layout={layout}
            authState={authState}
            prefetchedLoaderData={prefetchedLoaderData}
            isAuthenticatedPagesDiscoverable={isAuthenticatedPagesDiscoverable}
            showSearchBarInHeaderTabs={showSearchBarInHeaderTabs}
            hasProductsOrVersions={hasProductsOrVersions}
        >
            <AbstractLayoutEvaluatorContent tableOfContents={[]} frontmatter={frontmatter}>
                <div className="flex w-full flex-col gap-2 py-12">
                    <PageNode
                        serializableFoundNode={foundNode}
                        clientNodeId={clientNodeId as NodeId}
                        initialFilename={filename}
                        initialHtml={html}
                        initialFrontmatter={frontmatter}
                        initialOriginalFrontmatter={originalFrontmatter}
                        cssConfig={cssConfig}
                    />
                </div>
            </AbstractLayoutEvaluatorContent>
        </DocsLayout>
    );
}
