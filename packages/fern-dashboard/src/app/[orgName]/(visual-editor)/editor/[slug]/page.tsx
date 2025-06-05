import { redirect } from "next/navigation";

import { createEditableDocsLoader } from "@fern-api/docs-loader";
import { FernNavigation } from "@fern-api/fdr-sdk";
import { getPageId, slugjoin } from "@fern-api/fdr-sdk/navigation";

import { getCurrentSession } from "@/app/services/auth0/getCurrentSession";
import Editor from "@/components/editor/Editor";

import { mdxToHtml } from "./mdxToHtml";

export default async function Page() {
  const session = await getCurrentSession();

  if (session == null) {
    redirect("/");
  }

  const editableDocsLoader = await createEditableDocsLoader(
    "localhost:3000",
    "123",
    session?.accessToken
  );

  console.log("[1] docs", editableDocsLoader);
  const root = await editableDocsLoader.getRoot();
  console.log("[2] root", root);
  const foundNode = FernNavigation.utils.findNode(root, slugjoin(root.slug));
  if (foundNode.type !== "found") {
    console.log("[3] node not found");
    return null;
  }
  const rootNodePageId = getPageId(foundNode.node);
  if (rootNodePageId == null) {
    console.log("[4] rootNodePageId not found");
    return null;
  }
  const rootPage = await editableDocsLoader.getPage(rootNodePageId);
  console.log("[5] rootPage", rootPage);

  const html = await mdxToHtml(rootPage.markdown);

  return <Editor initialHtml={html} />;
}
