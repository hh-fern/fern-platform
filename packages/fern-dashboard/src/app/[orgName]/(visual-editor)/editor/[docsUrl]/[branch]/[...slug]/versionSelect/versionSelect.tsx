"use client";

import { getFallbackProduct, getFallbackVersion } from "@fern-api/docs-server/handle-node-fallbacks";
import type { FernLayoutConfig } from "@fern-api/docs-utils/types/layout-config";
import { NodeCollector, type RootNode, type Slug, utils } from "@fern-api/fdr-sdk/navigation";
import { VersionDropdown } from "@fern-docs/components/header/VersionDropdown";

export function VersionSelect({
    slug,
    layout,
    root,
    domain
}: {
    slug: Slug;
    layout: FernLayoutConfig;
    root: RootNode;
    domain: string;
}) {
    const useDenseLayout = layout.isHeaderDisabled;

    const foundNode = utils.findNode(root, slug);
    const collector = NodeCollector.collect(root);
    const versionNodes = collector.getVersionNodes();

    if (versionNodes.length === 0) {
        return null;
    }

    const currentProduct = getFallbackProduct(foundNode, root, slug);
    const version = getFallbackVersion(foundNode, root, slug);

    if (version == null) {
        return null;
    }

    const currentNode = foundNode.type === "found" ? foundNode.node : version;

    const parents = foundNode.type === "found" ? Array.from(foundNode.parents) : [];

    return (
        <VersionDropdown
            root={root}
            domain={domain}
            currentNode={currentNode}
            currentProduct={currentProduct ?? undefined}
            slugMap={collector.slugMap}
            parents={parents}
            fallbackVersion={version}
            useDenseLayout={useDenseLayout}
        />
    );
}
