"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";

import { FernNavigation } from "@fern-api/fdr-sdk";
import { NodeId } from "@fern-api/fdr-sdk/navigation";
import { type BaseState, useDocumentChanges } from "@fern-docs/components";
import { useSidebarClientNavigation } from "@fern-docs/components/sidebar/nodes/SidebarClientNavigationProvider";
import { SetCurrentNavigationNode } from "@fern-docs/components/state/navigation";
import { MdxToHtmlResponse, mdxToHtml } from "@fern-docs/mdx";

import { UnsupportedContent } from "@/components/editor/UnsupportedContent";
import { CSSProvider } from "@/components/editor/extension-custom-element/CSSContext";
import { OriginalElementsProvider } from "@/providers/OriginalElementsContext";
import { createMdxFrontmatter } from "@/utils/createMdxFrontmatter";

import PageContents from "./PageContents";

type SerializableFoundNode = Pick<
  FernNavigation.utils.Node.Found,
  | "type"
  | "node"
  | "sidebar"
  | "currentTab"
  | "currentProduct"
  | "currentVersion"
  | "isCurrentVersionDefault"
  | "isCurrentProductDefault"
>;

export declare namespace PageNode {
  export interface Props {
    serializableFoundNode?: SerializableFoundNode;
    clientNodeId?: NodeId;
    initialFilename?: string;
    initialHtml?: MdxToHtmlResponse["html"];
    initialFrontmatter?: MdxToHtmlResponse["frontmatter"];
    initialOriginalElements?: MdxToHtmlResponse["originalElements"];
    initialOriginalFrontmatter?: MdxToHtmlResponse["originalFrontmatter"];
    cssConfig?: { inline?: string[] };
  }
}

export default function PageNode({
  serializableFoundNode,
  clientNodeId,
  ...props
}: PageNode.Props) {
  const params = useParams();
  const branchName = params.branch as string;
  const { clientFoundNodes } = useSidebarClientNavigation();
  const clientFoundNode = clientNodeId
    ? clientFoundNodes?.[clientNodeId]
    : undefined;

  // Initialize new document system
  const baseState: BaseState = useMemo(
    () => ({
      files: new Map(),
      docsYml: "",
    }),
    []
  );

  const { getFileContent } = useDocumentChanges(baseState, {
    branchId: branchName,
    autoSave: false,
    autoSaveDelayMs: 300,
  });

  const foundNode:
    | SerializableFoundNode
    | FernNavigation.utils.Node.Found
    | undefined = serializableFoundNode || clientFoundNode;

  if (!foundNode) {
    throw new Error("No node data provided by the server or client");
  }

  const initialFilename =
    props.initialFilename ??
    ((foundNode.node.type === "page" && foundNode.node.pageId) ||
      foundNode.node.slug);

  let initialHtml = props.initialHtml;
  let initialFrontmatter = props.initialFrontmatter;
  let initialOriginalElements = props.initialOriginalElements;
  const initialOriginalFrontmatter = props.initialOriginalFrontmatter;

  // Store server data for comparison (before we potentially override it with localStorage)
  // Memoize to keep object reference stable if there are no changes
  const serverData = useMemo(() => {
    return initialHtml && initialFrontmatter && initialOriginalElements
      ? {
          html: initialHtml,
          frontmatter: initialFrontmatter,
          originalElements: initialOriginalElements,
        }
      : undefined;
  }, [initialHtml, initialFrontmatter, initialOriginalElements]);

  // Try to get latest content from new document system
  if (initialFilename) {
    const latestContent = getFileContent(initialFilename);
    if (latestContent) {
      // Parse MDX back to get latest edited version
      try {
        const { html, frontmatter, originalElements } = mdxToHtml(
          latestContent,
          {
            treatAsCustomElement: ["code"],
            treatAsUnsupported: ["math"],
          }
        );
        initialHtml = html;
        initialFrontmatter = frontmatter;
        initialOriginalElements = originalElements;
      } catch (error) {
        console.warn("Failed to parse latest content from new system:", error);
        // Fall back to props data
      }
    }
  }

  // No initial data provided, so we need to generate it
  if (!initialHtml || !initialFrontmatter || !initialOriginalElements) {
    // Generate default MDX when server data is missing/incomplete
    // Common for client pages where server has no initial content to provide
    const initialMdx = createMdxFrontmatter({
      title: foundNode.node.title,
      slug: foundNode.node.slug,
    });
    const { html, frontmatter, originalElements } = mdxToHtml(initialMdx, {
      treatAsCustomElement: ["code"],
      treatAsUnsupported: ["math"],
    });
    initialHtml = html;
    initialFrontmatter = frontmatter;
    initialOriginalElements = originalElements;
  }

  const isUnsupportedNode =
    foundNode.node.type !== "page" && foundNode.node.type !== "section";

  return (
    <>
      <SetCurrentNavigationNode
        nodeId={foundNode.node.id}
        sidebarRootNodeId={foundNode.sidebar?.id}
        tabId={foundNode.currentTab?.id}
        productId={foundNode.currentProduct?.productId}
        productSlug={foundNode.currentProduct?.slug}
        versionId={foundNode.currentVersion?.versionId}
        versionSlug={foundNode.currentVersion?.slug}
        versionIsDefault={foundNode.isCurrentVersionDefault}
        productIsDefault={foundNode.isCurrentProductDefault}
      />
      <OriginalElementsProvider originalElements={initialOriginalElements}>
        <CSSProvider cssConfig={props.cssConfig}>
          {isUnsupportedNode ? (
            <UnsupportedContent>
              This page is not visible in the editor.
            </UnsupportedContent>
          ) : (
            <PageContents
              filename={initialFilename || foundNode.node.slug || "untitled"}
              initialHtml={initialHtml}
              initialFrontmatter={initialFrontmatter}
              initialOriginalElements={initialOriginalElements}
              initialOriginalFrontmatter={initialOriginalFrontmatter}
              clientNodeId={clientNodeId}
              serverData={serverData}
            />
          )}
        </CSSProvider>
      </OriginalElementsProvider>
    </>
  );
}
