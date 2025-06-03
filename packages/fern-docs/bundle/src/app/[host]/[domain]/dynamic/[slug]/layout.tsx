import "server-only";

import { Metadata } from "next/types";

import { HydrationBoundary } from "jotai-ssr";

import { FernNavigation } from "@fern-api/fdr-sdk";
import { slugjoin } from "@fern-api/fdr-sdk/navigation";

import { getFernToken } from "@/app/fern-token";
import { getMetadataTitleFromPage } from "@/components/seo";
import SharedPage from "@/components/shared-page";
import { createCachedDocsLoader } from "@/server/docs-loader";
import { emptySidebarAtom } from "@/state/layout";

export default async function DynamicPage(props: {
  params: Promise<{ host: string; domain: string; slug: string }>;
}) {
  const { host, domain, slug } = await props.params;

  const loader = await createCachedDocsLoader(
    host,
    domain,
    await getFernToken()
  );

  const root = await loader.getRoot();

  const found = FernNavigation.utils.findNode(root, slugjoin(slug));
  let sidebarIsEmpty = false;
  if (found.type === "found") {
    sidebarIsEmpty =
      found.sidebar?.children.length === 0 ||
      (found.sidebar?.children.length === 1 &&
        found.sidebar?.children[0]?.type === "sidebarGroup" &&
        found.sidebar?.children[0].children.length === 1 &&
        found.sidebar?.children[0].children[0]?.type === "page");
  }

  return (
    <HydrationBoundary
      hydrateAtoms={[[emptySidebarAtom, sidebarIsEmpty]]}
      options={{ enableReHydrate: true }}
    >
      <SharedPage loader={loader} slug={slugjoin(slug)} />
    </HydrationBoundary>
  );
}

export async function generateMetadata(props: {
  params: Promise<{ host: string; domain: string; slug: string }>;
}): Promise<Metadata> {
  const { host, domain, slug } = await props.params;
  const loader = await createCachedDocsLoader(host, domain);
  return {
    title: await getMetadataTitleFromPage({
      loader,
      slug: slugjoin(slug),
    }),
  };
}
