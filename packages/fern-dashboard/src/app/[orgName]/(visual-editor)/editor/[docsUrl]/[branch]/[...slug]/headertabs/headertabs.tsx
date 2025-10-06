import type { AuthState } from "@fern-api/docs-server";
import { getTabs } from "@fern-api/docs-server/handle-node-fallbacks";
import type { FernLayoutConfig } from "@fern-api/docs-utils/types/layout-config";
import { type RootNode, type Slug, utils } from "@fern-api/fdr-sdk/navigation";
import { HeaderTabsList } from "@fern-docs/components/HeaderTabsList";

export function HeaderTabs({
    isAuthenticatedPagesDiscoverable,
    slug,
    root,
    authState,
    layout
}: {
    isAuthenticatedPagesDiscoverable: boolean;
    slug: Slug;
    root: RootNode;
    authState: AuthState;
    layout: FernLayoutConfig;
}) {
    if (layout.tabsPlacement !== "HEADER") {
        return null;
    }

    const showAuthenticatedNodes = isAuthenticatedPagesDiscoverable;

    const foundNode = utils.findNode(root, slug);

    const tabs = getTabs(
        foundNode,
        root,
        slug,
        showAuthenticatedNodes,
        authState.authed ? (authState.user.roles ?? []) : []
    );

    if (tabs == null) {
        return null;
    }

    return <HeaderTabsList tabs={tabs} />;
}
