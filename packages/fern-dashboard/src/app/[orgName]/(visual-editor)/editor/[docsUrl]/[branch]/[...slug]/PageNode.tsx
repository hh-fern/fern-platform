"use client";

import * as FernNavigation from "@fern-api/fdr-sdk/navigation";
import {
    type ClientPageDataDependencies,
    mergeFoundNodes,
    type ResolvedPageData,
    type SerializableFoundNode,
    type ServerPageDataDependencies,
    useNavigation
} from "@fern-docs/components/navigation";
import { SetCurrentNavigationNode } from "@fern-docs/components/state/navigation";
import { useEffect, useRef } from "react";
import { CSSProvider } from "@/components/editor/extension-custom-element/CSSContext";
import { UnsupportedContent } from "@/components/editor/UnsupportedContent";
import { useCurrentPage } from "@/providers/CurrentPageContext";

import PageContents from "./PageContents";

export declare namespace PageNode {
    export type Props = {
        /** Resolves to initial data for page nodes (optional for sections without content) */
        pageDataDeps?: ClientPageDataDependencies | ServerPageDataDependencies;
        /** Directly accepts found node from loader for non-page nodes (e.g. "endpoint", "section") */
        fallbackFoundNode?: SerializableFoundNode;
        cssConfig?: { inline?: string[] };
    };
}

export default function PageNode(props: PageNode.Props) {
    const { pageDataDeps, fallbackFoundNode, cssConfig } = props;

    const { hydrated, resolveInitialPageData, registerPage } = useNavigation();
    const { setCurrentFilename } = useCurrentPage();

    // Store initial page data in a ref so we don't re-resolve it on every render
    const initialPageDataRef = useRef<ResolvedPageData | null>(null);
    const pageDataErrorRef = useRef<Error | null>(null);

    // Try to resolve initial page data, catching errors to allow nav to still render
    if (hydrated && pageDataDeps && !initialPageDataRef.current && !pageDataErrorRef.current) {
        try {
            initialPageDataRef.current = resolveInitialPageData(pageDataDeps);
        } catch (error) {
            pageDataErrorRef.current = error instanceof Error ? error : new Error(String(error));
            console.error("Failed to resolve initial page data:", error);
        }
    }

    const initialPageData = initialPageDataRef.current;

    const didRegisterPage = useRef(false);
    useEffect(() => {
        if (didRegisterPage.current) {
            return;
        }
        if (initialPageData) {
            registerPage(initialPageData);
            didRegisterPage.current = true;
            // Set current filename so @devPanel knows about the current page
            setCurrentFilename(initialPageData.filename);
        }
    }, [hydrated, initialPageData, registerPage, setCurrentFilename]);

    // If there was an error resolving page data, show error message but don't crash
    if (pageDataErrorRef.current) {
        return <UnsupportedContent>Failed to load page data: {pageDataErrorRef.current.message}</UnsupportedContent>;
    }

    // For client pages, we need to wait for hydration and page resolution
    const isClientPage = pageDataDeps?.source === "client";

    if (isClientPage) {
        // Client pages need hydration to complete before we can resolve them from the store
        if (!hydrated) {
            // Still hydrating, show loading
            return null;
        }

        // Hydration complete - page data should be resolved now
        if (!initialPageData) {
            // Page doesn't exist in the navigation store
            return (
                <UnsupportedContent>
                    Client page not found in navigation store: &ldquo;
                    {pageDataDeps?.filename || "unknown"}
                    &rdquo;
                </UnsupportedContent>
            );
        }
    }

    // For sections without content, use fallbackFoundNode directly
    if (!initialPageData && !fallbackFoundNode) {
        // TODO: show a loading state
        return null;
    }

    const initialFoundNode = initialPageData?.foundNode;
    // If we have initialFoundNode, merge with fallback; otherwise just use fallback
    const found = initialFoundNode ? mergeFoundNodes(initialFoundNode, fallbackFoundNode) : fallbackFoundNode;

    if (!found) {
        return (
            <UnsupportedContent>
                This page is not visible in Fern Editor: &ldquo;
                {pageDataDeps?.filename || "unknown"}
                &rdquo;
            </UnsupportedContent>
        );
    }

    const isUnsupportedNodeType = found.node.type !== "page" && found.node.type !== "section";

    if (isUnsupportedNodeType) {
        return (
            <UnsupportedContent>
                This page type is not visible in Fern Editor: &ldquo;
                {found.node.type}
                &rdquo;
            </UnsupportedContent>
        );
    }

    // For sections with markdown content, we need to fetch and render it
    // For sections without content, just show a placeholder
    const isSectionWithContent =
        found.node.type === "section" && FernNavigation.hasMarkdown(found.node) && !initialPageData;

    return (
        <>
            <SetCurrentNavigationNode
                nodeId={found.node.id}
                sidebarRootNodeId={found.sidebar?.id}
                tabId={found.currentTab?.id}
                productId={found.currentProduct?.productId}
                productSlug={found.currentProduct?.slug}
                versionId={found.currentVersion?.versionId}
                versionSlug={found.currentVersion?.slug}
                versionIsDefault={found.isCurrentVersionDefault}
                productIsDefault={found.isCurrentProductDefault}
            />
            <CSSProvider cssConfig={cssConfig}>
                {initialPageData ? (
                    <PageContents
                        filename={initialPageData.filename}
                        initialHtml={initialPageData.html}
                        initialFrontmatter={initialPageData.frontmatter}
                    />
                ) : isSectionWithContent ? (
                    <UnsupportedContent>
                        Section pages are not yet supported in the editor. This section has markdown content that cannot
                        be edited here.
                    </UnsupportedContent>
                ) : (
                    <UnsupportedContent>
                        This section has no content. Add pages to this section from the sidebar.
                    </UnsupportedContent>
                )}
            </CSSProvider>
        </>
    );
}
