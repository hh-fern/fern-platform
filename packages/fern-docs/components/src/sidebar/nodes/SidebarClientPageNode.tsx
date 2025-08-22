"use client";

import { useParams, useRouter } from "next/navigation";
import { ReactNode, useMemo, useRef } from "react";

import { MinusCircleIcon } from "lucide-react";

import { type BaseState, useDocumentChanges } from "../../document-changes";
import { useScrollSidebarNodeIntoView } from "../../hooks/sidebar-scroll";
import { useIsSelectedSidebarNode } from "../../state/navigation";
import { SidebarLink } from "../SidebarLink";
import { useSidebarClientNavigation } from "./SidebarClientNavigationProvider";
import { SidebarPageNodeProps } from "./SidebarPageNode";

// Mirror the SidebarPageNodeProps interface
interface SidebarClientPageNodeProps extends SidebarPageNodeProps {}

export function SidebarClientPageNode({
  node,
  icon,
  depth,
  className,
}: SidebarClientPageNodeProps): ReactNode {
  const ref = useRef<HTMLAnchorElement>(null);
  const params = useParams();
  const { removeClientNode } = useSidebarClientNavigation();
  useScrollSidebarNodeIntoView(ref, node.id);
  const selected = useIsSelectedSidebarNode(node.id);
  const router = useRouter();

  // Initialize base state for new document change tracking
  const baseState: BaseState = useMemo(
    () => ({
      files: new Map(),
      docsYml: "",
    }),
    []
  );

  const { deleteFile, removePageFromDocsYml } = useDocumentChanges(baseState, {
    branchId: (params?.branch as string) || "default",
    autoSave: true,
    autoSaveDelayMs: 300,
  });

  // Simple localStorage helper for client pages
  const getClientPageData = (branch: string, nodeId: string) => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem(`client-pages-${branch}`);
      const pages = stored ? JSON.parse(stored) : {};
      return pages[nodeId] || null;
    } catch {
      return null;
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();

    if (params) {
      const orgName = params.orgName as string;
      const docsUrl = params.docsUrl as string;
      const branch = params.branch as string;

      // Get the stored full slug from localStorage
      const storedPage = getClientPageData(branch, node.id);
      const fullSlug = storedPage?.fullSlug || node.slug;

      // Navigate directly without loading states since all data is client-side
      const clientPageUrl = `/${orgName}/editor/${docsUrl}/${branch}/${fullSlug}?client-node-id=${node.id}`;
      router.push(clientPageUrl);
    }
  };

  const handleDelete = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (params?.branch && removeClientNode) {
      const branch = params.branch as string;

      // Get the stored page data to extract the full path
      const storedPage = getClientPageData(branch, node.id);
      const pagePath = storedPage?.fullSlug
        ? `${storedPage.fullSlug}.mdx`
        : `${node.slug}.mdx`;

      // Use new document change tracking for page deletion
      deleteFile(pagePath);
      removePageFromDocsYml(pagePath);

      // Remove the client node from the sidebar
      await removeClientNode(node.id);

      // Navigate directly to special "root" page, use router.push instead of window.location.href so navigation happens instantly
      // TODO: clean this up
      const rootPageUrl = `/${params.orgName}/editor/${params.docsUrl}/${params.branch}/root`;
      setTimeout(() => {
        router.push(rootPageUrl);
      }, 0);
    }
  };

  return (
    <div className="group relative">
      <SidebarLink
        ref={ref}
        icon={icon}
        nodeId={node.id}
        className={className}
        onClick={handleClick}
        depth={Math.max(depth - 1, 0)}
        title={node.title}
        hidden={node.hidden}
        authed={node.authed}
        shallow={true} // Always use shallow routing for client pages
        scroll={false} // Don't scroll since we're handling navigation manually
        selected={selected}
      />
      <button
        onClick={(e) => void handleDelete(e)}
        className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-md p-1 text-red-600 opacity-0 transition-opacity duration-200 hover:bg-red-50 hover:text-red-700 group-hover:opacity-100 dark:text-red-400 dark:hover:bg-red-950/20 dark:hover:text-red-300"
        title="Delete page"
        aria-label="Delete page"
      >
        <MinusCircleIcon className="size-4" />
      </button>
    </div>
  );
}
