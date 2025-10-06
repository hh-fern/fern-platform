import type { DocsV1Read } from "@fern-api/fdr-sdk";
import type { Availability, Slug, VersionId } from "@fern-api/fdr-sdk/navigation";

export interface ColorsConfig {
    light: DocsV1Read.ThemeConfig | undefined;
    dark: DocsV1Read.ThemeConfig | undefined;
}

export interface VersionSwitcherInfo {
    id: VersionId;
    title: string;
    slug: Slug;
    index: number;
    availability: Availability | undefined;
    pointsTo: Slug | undefined;
    landingPage: Slug | undefined;
    hidden: boolean | undefined;
    authed: boolean | undefined;
}

interface SidebarTabGroup {
    type: "tabGroup";
    title: string;
    icon: string | undefined;
    index: number;
    slug: Slug;
    pointsTo: Slug | undefined;
    hidden: boolean | undefined;
    authed: boolean | undefined;
}

interface SidebarTabLink {
    type: "tabLink";
    title: string;
    icon: string | undefined;
    index: number;
    url: string;
}

interface SidebarTabChangelog {
    type: "tabChangelog";
    title: string;
    icon: string | undefined;
    index: number;
    slug: Slug;
    hidden: boolean | undefined;
    authed: boolean | undefined;
}

export type SidebarTab = SidebarTabGroup | SidebarTabLink | SidebarTabChangelog;
