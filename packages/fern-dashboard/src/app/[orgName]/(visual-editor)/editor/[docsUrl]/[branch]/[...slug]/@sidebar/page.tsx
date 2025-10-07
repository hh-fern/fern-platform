import { PrefetchedDocsLoader } from "@fern-api/docs-loader";
import * as FernNavigation from "@fern-api/fdr-sdk/navigation";
import { getPageId, slugjoin } from "@fern-api/fdr-sdk/navigation";
import {
    constructEditorSlug,
    getClientPageDefaultFilename,
    getSerializableFoundNode,
    ROOT_SLUG_ALIAS,
    type SerializableFoundNode
} from "@fern-docs/components/navigation";
import { notFound, redirect } from "next/navigation";
import { getCurrentSession } from "@/app/services/auth0/getCurrentSession";
import type { Auth0OrgName } from "@/app/services/auth0/types";
import { getCachedEditableDocsLoader } from "@/app/services/docs-loader/cachedEditableDocsLoader";
import { getHostFromHeaders } from "@/utils/getHostFromHeaders";
import type { EncodedDocsUrl } from "@/utils/types";

import type { PageNode as PageNodeNamespace } from "../PageNode";
import PageSidebar from "./PageSidebar";

export default async function SidebarPage({
    params,
    searchParams
}: {
    params: Promise<{
        orgName: Auth0OrgName;
        docsUrl: EncodedDocsUrl;
        slug: string[];
        branch: string;
    }>;
    searchParams: Promise<Record<string, string>>;
}) {
    const { orgName, docsUrl, branch, slug } = await params;
    const resolvedSearchParams = await searchParams;
    const session = await getCurrentSession();
    const host = await getHostFromHeaders();
    // Use cached loader - this will reuse the loader created in layout.tsx
    const loader = await getCachedEditableDocsLoader({
        host,
        encodedDocsUrl: docsUrl,
        fernToken: session?.accessToken,
        branchName: branch
    });
    const [config, authState, edgeFlags, layout, root] = await Promise.all([
        loader.getConfig(),
        loader.getAuthState(),
        loader.getEdgeFlags(),
        loader.getLayout(),
        loader.getRoot()
    ]);

    const requestedSlug = slugjoin(slug);

    let pageDataDeps: PageNodeNamespace.Props["pageDataDeps"];
    let serializableFoundNode: SerializableFoundNode | undefined;

    if (resolvedSearchParams["client-page"]) {
        pageDataDeps = {
            source: "client",
            filename: getClientPageDefaultFilename(requestedSlug)
        };
    } else {
        // If requested slug == ROOT_SLUG_ALIAS ("root"), use slug from the root node instead
        const navigationSlug = requestedSlug === ROOT_SLUG_ALIAS ? root.slug : requestedSlug;
        const navigationNode = FernNavigation.utils.findNode(root, navigationSlug);

        if (navigationNode.type === "notFound") {
            // Throw 404 to prevent infinite redirect loop
            if (navigationSlug === root.slug) {
                notFound();
            }
            return redirect(
                constructEditorSlug({
                    orgName,
                    docsUrl,
                    branchName: branch,
                    slug: ROOT_SLUG_ALIAS
                })
            );
        }

        // Redirect to redirect target if specified
        if (navigationNode.type === "redirect") {
            return redirect(
                constructEditorSlug({
                    orgName,
                    docsUrl,
                    branchName: branch,
                    slug: navigationNode.redirect
                })
            );
        }

        // Get a serializable copy of the found node to be passed to the sidebar
        serializableFoundNode = getSerializableFoundNode(navigationNode);
    }

    // Extract sidebar and tabs from the current page's context
    // This ensures the sidebar shows the correct tab for the current page
    let sidebarRoot: FernNavigation.SidebarRootNode | undefined;
    let tabs: FernNavigation.TabNode[] | undefined;

    if (serializableFoundNode) {
        sidebarRoot = serializableFoundNode.sidebar;
        tabs = serializableFoundNode.tabs as FernNavigation.TabNode[];
    } else {
        // Fallback: find any page to extract sidebar/tabs and baseFoundNode
        // This is used for client pages or when no navigation node is found
        const firstPageSlug = root.pointsTo ?? root.slug;
        const foundNode = FernNavigation.utils.findNode(root, firstPageSlug);
        if (foundNode.type === "found") {
            sidebarRoot = foundNode.sidebar;
            tabs = foundNode.tabs as FernNavigation.TabNode[];
            // Use this as the fallback found node for create button context
            serializableFoundNode = getSerializableFoundNode(foundNode);
        }
    }

    const prefetchedLoaderData = new PrefetchedDocsLoader({
        domain: loader.domain,
        config,
        authState,
        edgeFlags,
        layout: {
            ...layout,
            sidebarRoot,
            tabs
        }
    }).serializable();

    return <PageSidebar prefetchedLoaderData={prefetchedLoaderData} fallbackFoundNode={serializableFoundNode} />;
}
