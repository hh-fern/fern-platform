import { ReactNode } from "react";

import { NavigationNode } from "@fern-api/fdr-sdk/navigation";
import { hasMetadata } from "@fern-api/fdr-sdk/navigation";

import { FaIconServer } from "../../../fern-docs/components/src/fa-icon-server";
import { NoZoom } from "../../../fern-docs/components/src/mdx/components/html/image";

export const processIcon = (
  node: NavigationNode,
  fallback?: string
): ReactNode | undefined => {
  if (!hasMetadata(node) && node.type !== "link") {
    return undefined;
  }

  if (node.icon?.startsWith("<") && node.icon?.endsWith(">")) {
    return (
      <NoZoom>
        <span
          className="size-5"
          dangerouslySetInnerHTML={{ __html: node.icon }}
        />
      </NoZoom>
    );
  }

  if (node.icon) {
    return <FaIconServer icon={node.icon} />;
  }

  if (fallback) {
    return <FaIconServer icon={fallback} />;
  }

  return undefined;
};
