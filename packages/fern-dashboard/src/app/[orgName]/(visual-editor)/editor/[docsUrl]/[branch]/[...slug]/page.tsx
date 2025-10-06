import "server-only";

import { createEditableDocsLoader, type DangerousTransmittableDocsLoaderData } from "@fern-api/docs-loader";
import type { Frontmatter } from "@fern-api/fdr-sdk/docs";
import { getPageId, type NodeId, slugjoin, utils } from "@fern-api/fdr-sdk/navigation";
import type { Auth0OrgName } from "@fern-dashboard/services/auth/types";
import { AbstractLayoutEvaluatorContent } from "@fern-docs/components/layouts/AbstractLayoutEvaluatorContent";
import { mdxToHtml } from "@fern-docs/mdx";
import { notFound, redirect } from "next/navigation";
import { assertAuthAndFetchGithubUrl } from "@/app/services/dal/github/assertAuthAndFetchGithubUrl";
import { GitHubLoader } from "@/app/services/github/github-loader";
import { constructEditorSlug, ROOT_SLUG_ALIAS } from "@/utils/editor-routing";
import { getHostFromHeaders } from "@/utils/getHostFromHeaders";
import { parseDocsUrlParam } from "@/utils/parseDocsUrlParam";
import type { EncodedDocsUrl } from "@/utils/types";
import { DocsLayout } from "./docs-layout";
import { LazyDocsPage } from "./lazy-docs-page";
import PageNode from "./PageNode";

export default async function Page({
    params,
    searchParams
}: {
    params: Promise<{
        orgName: Auth0OrgName;
        docsUrl: EncodedDocsUrl;
        branch: string;
        slug: string[];
    }>;
    searchParams: Promise<Record<string, string>>;
}) {
    const { orgName, docsUrl, branch, slug: slugArray } = await params;

    const { githubUrl, session } = await assertAuthAndFetchGithubUrl({
        orgName,
        docsUrl: parseDocsUrlParam({ docsUrl })
    });

    const [resolvedSearchParams, host] = await Promise.all([searchParams, getHostFromHeaders()]);

    const loader = await createEditableDocsLoader({
        host,
        encodedDocsUrl: docsUrl,
        fernToken: session.accessToken,
        gitLoader: new GitHubLoader(githubUrl),
        branchName: branch
    });

    const [root, config, layout, authState, flags, files, colors, { basePath }] = await Promise.all([
        loader.getRoot(),
        loader.getConfig(),
        loader.getLayout(),
        loader.getAuthState(),
        loader.getEdgeFlags(),
        loader.getFiles(),
        loader.getColors(),
        loader.getMetadata()
    ]);

    const prefetchedLoaderData: DangerousTransmittableDocsLoaderData = {
        domain: loader.domain,
        authState,
        edgeFlags: flags,
        layout
    };

    const slugAlias = slugjoin(slugArray);
    const slug = slugAlias === ROOT_SLUG_ALIAS ? root.slug : slugAlias;
    const foundNode = utils.findNode(root, slugjoin(slug));
    // Check if client-node-id is passed as search param
    const clientNodeId = resolvedSearchParams["client-node-id"];
    // If the page is not found and client-node-id is not passed, redirect to appropriate page
    // For client pages, we allow not-found nodes as long as clientNodeId is provided
    if (foundNode.type !== "found" && !clientNodeId) {
        if (foundNode.redirect) {
            redirect(
                constructEditorSlug({
                    orgName,
                    docsUrl,
                    branchName: branch,
                    slug: foundNode.redirect
                })
            );
        }
        if (slug === root.slug) {
            // TODO: fix this so that we can redirect to the root page. right now, the root slug is not always the
            // root page. (e.g. elevenlabs' root == "/docs" but the root page is "/docs/overview")
            notFound();
        }
        // only redirect to root if the slug is not the root slug, otherwise we'll get a redirect loop
        redirect(
            constructEditorSlug({
                orgName,
                docsUrl,
                branchName: branch,
                slug: ROOT_SLUG_ALIAS
            })
        );
    }

    const pageId = foundNode.type === "found" ? getPageId(foundNode.node) : undefined;

    // For client pages, don't try to load server data
    const page = pageId && !clientNodeId ? await loader.getPage(pageId) : undefined;

    const filename = page?.filename;
    const mdx = page?.markdown;
    const cssConfig = page?.css; // Extract CSS configuration
    const rawMarkdown = page?.rawMarkdown;

    // Until sites are deployed with the version of FDR that supports rawMarkdown, we need to parse the markdown
    // from the server as a fallback.
    const { html, frontmatter, originalFrontmatter } = rawMarkdown
        ? mdxToHtml(rawMarkdown, {
              treatAsUnsupported: ["math"]
          })
        : mdx
          ? mdxToHtml(mdx, {
                treatAsUnsupported: ["math"]
            })
          : {};

    const hasProductsOrVersions = root.child.type === "productgroup" || root.child.type === "versioned";
    const showSearchBarInHeaderTabs = layout.searchbarPlacement === "HEADER_TABS";

    return (
        <LazyDocsPage
            domain={loader.domain}
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
            isAuthenticatedPagesDiscoverable={flags.isAuthenticatedPagesDiscoverable}
            showSearchBarInHeaderTabs={showSearchBarInHeaderTabs}
            hasProductsOrVersions={hasProductsOrVersions}
            foundNode={
                foundNode.type === "found"
                    ? {
                          type: foundNode.type,
                          node: foundNode.node,
                          sidebar: foundNode.sidebar,
                          currentTab: foundNode.currentTab,
                          currentProduct: foundNode.currentProduct,
                          currentVersion: foundNode.currentVersion,
                          isCurrentVersionDefault: foundNode.isCurrentVersionDefault,
                          isCurrentProductDefault: foundNode.isCurrentProductDefault
                      }
                    : undefined
            }
            clientNodeId={clientNodeId as NodeId}
            filename={filename}
            html={html}
            cssConfig={cssConfig}
            originalFrontmatter={originalFrontmatter}
        />
    );
}
