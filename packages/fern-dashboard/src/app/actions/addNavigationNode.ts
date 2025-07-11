"use server";

import { createEditableDocsLoader } from "@fern-api/docs-loader";
import { FernNavigation } from "@fern-api/fdr-sdk";

import { getCurrentSession } from "@/app/services/auth0/getCurrentSession";
import { getHostFromHeaders } from "@/utils/getHostFromHeaders";

export async function addNavigationNode(
  docsUrl: string,
  node: FernNavigation.NavigationNode
) {
  const host = await getHostFromHeaders();
  const session = await getCurrentSession();
  const loader = await createEditableDocsLoader(
    host,
    docsUrl,
    session?.accessToken
  );
  return loader.addNavigationNode(node);
}
