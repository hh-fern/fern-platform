import { createEditableDocsLoader, type DangerousTransmittableDocsLoaderData } from "@fern-api/docs-loader";
import type { Auth0OrgName } from "@fern-dashboard/services/auth/types";
import { EditorLinkInterceptor } from "@fern-dashboard/visual-editor/client/components/editor";
import { EditorRoutingProvider, FileResolverProvider } from "@fern-dashboard/visual-editor/client/providers";
import { Providers } from "@fern-docs/components/providers/providers";
import { RootNodeProvider } from "@fern-docs/components/state/navigation";
import {
    getAllSidebarRootNodes,
    getSidebarRootNodeIdToChildToParentsMap
} from "@fern-docs/components/state/navigation-server";
import { FernThemeProvider } from "@fern-docs/components/theme";
import { GlobalStyles } from "@fern-docs/components/theming/global-styles";
import type React from "react";
import { assertAuthAndFetchGithubUrl } from "@/app/services/dal/github/assertAuthAndFetchGithubUrl";
import { GitHubLoader } from "@/app/services/github/github-loader";
import { getHostFromHeaders } from "@/utils/getHostFromHeaders";
import { parseDocsUrlParam } from "@/utils/parseDocsUrlParam";
import type { EncodedDocsUrl } from "@/utils/types";
import DevPanel from "./devPanel/devPanel";

import "./index.css";

export default async function VisualEditorPreviewLayout({
    params: promiseParams,
    children
}: Readonly<{
    params: Promise<{
        orgName: Auth0OrgName;
        docsUrl: EncodedDocsUrl;
        slug: string[];
        branch: string;
    }>;
    children: React.JSX.Element;
    headertabs: React.ReactNode;
    versionSelect: React.ReactNode;
    productSelect: React.ReactNode;
    sidebar: React.ReactNode;
    logo: React.ReactNode;
    devPanel: React.ReactNode;
}>) {
    const { orgName, docsUrl, branch } = await promiseParams;

    const { githubUrl, session } = await assertAuthAndFetchGithubUrl({
        orgName,
        docsUrl: parseDocsUrlParam({ docsUrl })
    });
    const host = await getHostFromHeaders();

    // TODO: createEditableDocsLoader should be called here once, and data passed to child pages (@...) rather than called in those places as well
    const loader = await createEditableDocsLoader({
        host,
        encodedDocsUrl: docsUrl,
        fernToken: session.accessToken,
        gitLoader: new GitHubLoader(githubUrl),
        branchName: branch
    });

    const [colors, layout, fonts, config, unsafe_fullRoot, files] = await Promise.all([
        loader.getColors(),
        loader.getLayout(),
        loader.getFonts(),
        loader.getConfig(),
        loader.unsafe_getFullRoot(),
        loader.getFiles()
    ]);

    const sidebarRootNodes = getAllSidebarRootNodes(unsafe_fullRoot);
    const sidebarRootNodesToChildToParentsMap = getSidebarRootNodeIdToChildToParentsMap(sidebarRootNodes);

    return (
        <div className="m-2 flex h-[calc(100vh-var(--header-toolbar-height))]">
            <FileResolverProvider files={files}>
                <Providers skipProgressProvider={true}>
                    <FernThemeProvider
                        hasLight={Boolean(colors.light)}
                        hasDark={Boolean(colors.dark)}
                        lightThemeColor={colors.light?.themeColor}
                        darkThemeColor={colors.dark?.themeColor}
                    >
                        <GlobalStyles
                            domain={docsUrl}
                            layout={layout}
                            fonts={fonts}
                            light={colors.light}
                            dark={colors.dark}
                            inlineCss={config.css?.inline}
                            scopeSelector="#preview-container @theme"
                            lightSelector=".light #preview-container"
                            darkSelector=".dark #preview-container"
                        />
                        <RootNodeProvider sidebarRootNodesToChildToParentsMap={sidebarRootNodesToChildToParentsMap}>
                            <div className="border-1 flex flex-1 flex-col overflow-hidden rounded-2xl border-gray-500 shadow-lg">
                                {/* BOUNDARY NOTE: All items within the #preview-container will be themed with domain-specific styles. */}
                                <EditorRoutingProvider value={{ orgName, docsUrl, branch }}>
                                    <div id="preview-container">
                                        <EditorLinkInterceptor />
                                        {children}
                                    </div>
                                </EditorRoutingProvider>
                            </div>
                        </RootNodeProvider>
                    </FernThemeProvider>
                </Providers>
            </FileResolverProvider>
            <DevPanel />
        </div>
    );
}
