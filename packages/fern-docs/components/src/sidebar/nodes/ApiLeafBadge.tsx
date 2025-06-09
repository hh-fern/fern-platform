"use client";

import { cn } from "@fern-api/docs-utils/cn";
import type { FernNavigation } from "@fern-api/fdr-sdk";

import { HttpMethodBadge } from "../../badges/http-method-badge";
import { useIsSelectedSidebarNode } from "../../utils/navigation";

export function ApiLeafBadge({
  node,
  className,
}: {
  node: FernNavigation.NavigationNodeApiLeaf;
  className?: string;
}) {
  const selected = useIsSelectedSidebarNode(node.id);
  if (node.type === "webSocket") {
    return (
      <HttpMethodBadge
        method="GET"
        size="sm"
        variant={selected ? "solid" : "subtle"}
        className={className}
      >
        WSS
      </HttpMethodBadge>
    );
  } else {
    if (node.type === "endpoint" && node.isResponseStream) {
      return (
        <HttpMethodBadge
          method={node.method}
          size="sm"
          variant={selected ? "solid" : "subtle"}
          className={cn(className, {
            "tracking-tighter": node.isResponseStream,
          })}
        >
          STREAM
        </HttpMethodBadge>
      );
    }

    return (
      <HttpMethodBadge
        method={node.method}
        size="sm"
        variant={selected ? "solid" : "subtle"}
        className={className}
      />
    );
  }
}
