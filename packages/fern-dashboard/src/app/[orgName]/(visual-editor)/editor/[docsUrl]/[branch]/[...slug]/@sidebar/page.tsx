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

    // Find any page in the navigation to extract the sidebar and tabs
    // All pages within the same docs share the same sidebar/tabs structure
    const firstPageSlug = root.pointsTo ?? root.slug;
    const foundNode = FernNavigation.utils.findNode(root, firstPageSlug);

    let sidebarRoot: FernNavigation.SidebarRootNode | undefined;
    let tabs: FernNavigation.TabNode[] | undefined;

    if (foundNode.type === "found") {
        sidebarRoot = foundNode.sidebar;
        tabs = foundNode.tabs as FernNavigation.TabNode[];
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

    // Sidebar doesn't need page-specific data - it renders the same navigation tree
    // and relies on global navigation state (atoms) to determine what's selected
    return <PageSidebar prefetchedLoaderData={prefetchedLoaderData} />;
}
