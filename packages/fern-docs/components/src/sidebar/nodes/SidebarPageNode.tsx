import { ReactNode } from "react";

import { MinusCircle } from "lucide-react";

import type * as FernNavigation from "@fern-api/fdr-sdk/navigation";

import { WithFeatureFlags } from "../../feature-flags/WithFeatureFlags";
import { SidebarSlugLink } from "../SidebarLink";

export interface SidebarPageNodeProps {
  node: FernNavigation.NavigationNodeWithMarkdown;
  icon: React.ReactNode;
  depth: number;
  className?: string;
  shallow?: boolean;
  onDelete?: (nodeId: FernNavigation.NodeId) => void;
}

export function SidebarPageNode({
  node,
  icon,
  depth,
  className,
  shallow,
  onDelete,
}: SidebarPageNodeProps): ReactNode {
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
    <WithFeatureFlags featureFlags={node.featureFlags}>
      <SidebarSlugLink
        icon={icon}
        nodeId={node.id}
        className={`${className} group`}
        slug={node.slug}
        depth={Math.max(depth - 1, 0)}
        title={node.title}
        hidden={node.hidden}
        authed={node.authed}
        shallow={shallow}
        rightElement={deleteIcon}
      />
    </WithFeatureFlags>
  );
}
