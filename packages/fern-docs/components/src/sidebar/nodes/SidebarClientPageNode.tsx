"use client";

import { useParams } from "next/navigation";
import { ReactNode, useRef } from "react";

import { MinusCircle } from "lucide-react";

import { useScrollSidebarNodeIntoView } from "../../hooks/sidebar-scroll";
import { useIsSelectedSidebarNode } from "../../state/navigation";
import { SidebarLink } from "../SidebarLink";
import { SidebarPageNodeProps } from "./SidebarPageNode";
import { ClientPageStorage } from "./clientPageStorage";

// Mirror the SidebarPageNodeProps interface
interface SidebarClientPageNodeProps extends SidebarPageNodeProps {}

export function SidebarClientPageNode({
  node,
  icon,
  depth,
  className,
  onDelete,
}: SidebarClientPageNodeProps): ReactNode {
  const ref = useRef<HTMLAnchorElement>(null);
  const params = useParams();
  useScrollSidebarNodeIntoView(ref, node.id);
  const selected = useIsSelectedSidebarNode(node.id);

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();

    if (params) {
      const orgName = params.orgName as string;
      const docsUrl = params.docsUrl as string;
      const branch = params.branch as string;

      // Get the stored full slug from localStorage
      const storedPages = ClientPageStorage.loadClientPages(branch);
      const storedPage = storedPages[node.id];
      const fullSlug = storedPage?.fullSlug || node.slug;

      // Navigate directly without loading states since all data is client-side
      const clientPageUrl = `/${orgName}/editor/${docsUrl}/${branch}/${fullSlug}?client-node-id=${node.id}`;
      // TODO: use router.push instead of window.location.href (currently there's a bug when the page hits an error boundary)
      window.location.href = clientPageUrl;
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete?.(node.id);
  };

  const deleteIcon = onDelete && (
    <button
      className="border-0 bg-transparent p-0 opacity-0 transition-opacity group-hover:opacity-100"
      onClick={handleDeleteClick}
      title="Delete page"
      type="button"
    >
      <MinusCircle className="h-4 w-4 text-red-600 hover:text-red-700" />
    </button>
  );

  return (
    <SidebarLink
      ref={ref}
      icon={icon}
      nodeId={node.id}
      className={`${className} group`}
      onClick={handleClick}
      depth={Math.max(depth - 1, 0)}
      title={node.title}
      hidden={node.hidden}
      authed={node.authed}
      shallow={true} // Always use shallow routing for client pages
      scroll={false} // Don't scroll since we're handling navigation manually
      selected={selected}
      rightElement={deleteIcon}
    />
  );
}
