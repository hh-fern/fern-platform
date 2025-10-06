"use client";

import type { AuthState } from "@fern-api/docs-server/auth/getAuthState";
import type { DocsLoader } from "@fern-api/docs-server/docs-loader";
import { getFallbackProduct } from "@fern-api/docs-server/handle-node-fallbacks";
import type { FileData } from "@fern-api/docs-utils/types/file-data";
import type { FernLayoutConfig } from "@fern-api/docs-utils/types/layout-config";
import { type RootNode, type Slug, utils } from "@fern-api/fdr-sdk/navigation";
import { ProductDropdown } from "@fern-docs/components/header/ProductDropdown";

export function ProductSelect({
    slug,
    layout,
    root,
    authState,
    files,
    isAuthenticatedPagesDiscoverable
}: {
    slug: Slug;
    layout: FernLayoutConfig;
    root: RootNode;
    authState: AuthState;
    files: Record<string, FileData>;
    isAuthenticatedPagesDiscoverable: boolean;
}) {
    const useDenseLayout = layout.isHeaderDisabled;

    const foundNode = utils.findNode(root, slug);

    const fallbackProduct = getFallbackProduct(foundNode, root, slug);
    if (fallbackProduct == null) {
        return null;
    }

    return (
        <ProductDropdown
            root={root}
            authState={authState}
            files={files}
            isAuthenticatedPagesDiscoverable={isAuthenticatedPagesDiscoverable}
            fallbackProduct={fallbackProduct}
            useDenseLayout={useDenseLayout}
        />
    );
}
