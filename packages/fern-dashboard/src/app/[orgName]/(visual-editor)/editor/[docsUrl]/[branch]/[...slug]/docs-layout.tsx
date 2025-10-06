"use client";

import type { DangerousTransmittableDocsLoaderData } from "@fern-api/docs-loader/client";
import type { AuthState } from "@fern-api/docs-server/auth/getAuthState";
import type { FernColorTheme } from "@fern-api/docs-utils";
import type { FileData } from "@fern-api/docs-utils/types/file-data";
import type { FernLayoutConfig } from "@fern-api/docs-utils/types/layout-config";
import type { DocsV1Read } from "@fern-api/fdr-sdk/client/types";
import type { Frontmatter } from "@fern-api/fdr-sdk/docs";
import type { RootNode, Slug } from "@fern-api/fdr-sdk/navigation";
import { AbstractHeaderTabsRoot } from "@fern-docs/components/abstract/AbstractHeaderTabsRoot";
import { FERN_SEARCH_BUTTON_ID } from "@fern-docs/components/constants";
import { NavbarLinks } from "@fern-docs/components/header/NavbarLinks";
import { SidebarContainer } from "@fern-docs/components/sidebar/SidebarContainer";
import AbstractDefaultDocs from "@fern-docs/components/theming/AbstractDefaultDocs";
import { DesktopSearchButton } from "@fern-docs/search-ui/components/desktop/desktop-search-button";
import React from "react";
import { PreviewHeader } from "@/components/docs-preview/PreviewHeader";
import { HeaderTabs } from "./headertabs/headertabs";
import { Logo } from "./logo/logo";
import { ProductSelect } from "./productSelect/productSelect";
import { Sidebar } from "./sidebar/sidebar";
import { VersionSelect } from "./versionSelect/versionSelect";

export function DocsLayout({
    children,
    domain,
    config,
    slug,
    root,
    basePath,
    files,
    frontmatter,
    colors,
    layout,
    authState,
    prefetchedLoaderData,
    isAuthenticatedPagesDiscoverable,
    showSearchBarInHeaderTabs,
    hasProductsOrVersions
}: {
    children: React.ReactNode;
    domain: string;
    config: Omit<DocsV1Read.DocsDefinition["config"], "navigation" | "root">;
    slug: Slug;
    root: RootNode;
    basePath: string;
    files: Record<string, FileData>;
    frontmatter: Frontmatter | undefined;
    colors: {
        light?: FernColorTheme;
        dark?: FernColorTheme;
    };
    layout: FernLayoutConfig;
    authState: AuthState;
    prefetchedLoaderData: DangerousTransmittableDocsLoaderData;
    isAuthenticatedPagesDiscoverable: boolean;
    showSearchBarInHeaderTabs: boolean;
    hasProductsOrVersions: boolean;
}) {
    return (
        <AbstractDefaultDocs
            header={
                <PreviewHeader
                    navbarLinks={<NavbarLinks config={config} />}
                    headertabs={
                        <HeaderTabs
                            isAuthenticatedPagesDiscoverable={isAuthenticatedPagesDiscoverable}
                            slug={slug}
                            root={root}
                            authState={authState}
                            layout={layout}
                        />
                    }
                    versionSelect={<VersionSelect slug={slug} layout={layout} root={root} domain={domain} />}
                    productSelect={
                        <ProductSelect
                            slug={slug}
                            layout={layout}
                            root={root}
                            authState={authState}
                            files={files}
                            isAuthenticatedPagesDiscoverable={isAuthenticatedPagesDiscoverable}
                        />
                    }
                    logo={<Logo basePath={basePath} config={config} files={files} frontmatter={frontmatter} />}
                    showSearchBar={layout.searchbarPlacement === "HEADER"}
                />
            }
            lightSidebarClassName={colors.light?.sidebarBackgroundTheme === "dark" ? "dark" : undefined}
            darkSidebarClassName={colors.dark?.sidebarBackgroundTheme === "light" ? "light" : undefined}
            lightHeaderClassName={colors.light?.headerBackgroundTheme === "dark" ? "dark" : undefined}
            darkHeaderClassName={colors.dark?.headerBackgroundTheme === "light" ? "light" : undefined}
            isHeaderDisabled={layout.isHeaderDisabled}
            versionSelect={<VersionSelect slug={slug} layout={layout} root={root} domain={domain} />}
            productSelect={
                <ProductSelect
                    slug={slug}
                    layout={layout}
                    root={root}
                    authState={authState}
                    files={files}
                    isAuthenticatedPagesDiscoverable={isAuthenticatedPagesDiscoverable}
                />
            }
            isSidebarFixed={
                !!colors.dark?.sidebarBackground || !!colors.light?.sidebarBackground || layout.isHeaderDisabled
            }
            sidebar={
                <SidebarContainer
                    logo={
                        <React.Suspense fallback={null}>
                            <Logo basePath={basePath} config={config} files={files} frontmatter={frontmatter} />
                        </React.Suspense>
                    }
                    showSearchBar={layout.searchbarPlacement === "SIDEBAR"}
                    showHeaderInSidebar={layout.isHeaderDisabled}
                    productSelect={
                        <React.Suspense fallback={null} key="product-select-3">
                            <ProductSelect
                                slug={slug}
                                layout={layout}
                                root={root}
                                authState={authState}
                                files={files}
                                isAuthenticatedPagesDiscoverable={isAuthenticatedPagesDiscoverable}
                            />
                        </React.Suspense>
                    }
                    versionSelect={
                        <React.Suspense fallback={null} key="version-select-3">
                            <VersionSelect slug={slug} layout={layout} root={root} domain={domain} />
                        </React.Suspense>
                    }
                    navbarLinks={
                        <React.Suspense fallback={null}>
                            <NavbarLinks config={config} />
                        </React.Suspense>
                    }
                    loginButton={
                        <React.Suspense fallback={null}>
                            {/* <LoginButton
                                                            loader={loader}
                                                            className="my-6 flex w-full justify-between lg:hidden"
                                                            showIcon
                                                            /> */}
                        </React.Suspense>
                    }
                    searchBar={<DesktopSearchButton />}
                >
                    <Sidebar config={config} slug={slug} root={root} prefetchedLoaderData={prefetchedLoaderData} />
                </SidebarContainer>
            }
            headerTabs={
                <AbstractHeaderTabsRoot
                    searchBar={
                        showSearchBarInHeaderTabs && (
                            <DesktopSearchButton
                                id={FERN_SEARCH_BUTTON_ID}
                                className="fern-header-search-bar cursor-not-allowed overflow-hidden"
                            />
                        )
                    }
                >
                    <HeaderTabs
                        isAuthenticatedPagesDiscoverable={isAuthenticatedPagesDiscoverable}
                        slug={slug}
                        root={root}
                        authState={authState}
                        layout={layout}
                    />
                </AbstractHeaderTabsRoot>
            }
            hasProductsOrVersions={hasProductsOrVersions}
            // announcement={<div>Announcement</div>}
        >
            <div className="flex h-[var(--preview-container-height)] flex-1 justify-center overflow-y-scroll">
                {children}
            </div>
        </AbstractDefaultDocs>
    );
}
