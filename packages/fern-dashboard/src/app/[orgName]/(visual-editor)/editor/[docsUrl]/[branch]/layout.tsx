import "server-only";

import type { Auth0OrgName } from "@fern-dashboard/services/auth/types";
import { HeaderToolbar } from "@fern-dashboard/visual-editor/client/components/editor/HeaderToolbar";
import { PreviewOnlyNotification } from "@fern-dashboard/visual-editor/client/components/editor/PreviewOnlyNotification";
import { BranchProvider } from "@fern-dashboard/visual-editor/client/providers/BranchContext";
import { ClientMDXProvider } from "@fern-dashboard/visual-editor/client/providers/ClientMDXProvider";
import { DevModeProvider } from "@fern-dashboard/visual-editor/client/providers/DevModeProvider";
import { EditorProvider } from "@fern-dashboard/visual-editor/client/providers/EditorContext";
import { GitHubRepoProvider } from "@fern-dashboard/visual-editor/client/providers/GitHubRepoContext";
import { GitPRProvider } from "@fern-dashboard/visual-editor/client/providers/GitPRContext";
import { OrgNameProvider } from "@fern-dashboard/visual-editor/client/providers/OrgNameContext";
import { PagesStoreProvider } from "@fern-dashboard/visual-editor/client/providers/PagesStoreContext";
import { NavigationStoreProvider } from "@fern-docs/components/navigation/NavigationStoreContext";
import { ThemeProvider } from "next-themes";
import type React from "react";
import getGithubSourceMetadata from "@/app/api/get-github-source-metadata/handler";
import { assertAuthAndFetchGithubUrl } from "@/app/services/dal/github/assertAuthAndFetchGithubUrl";
import createBranchIfNotExists from "@/app/services/dal/github/createBranchIfNotExists";
import { getAuthenticatedSessionOrRedirect } from "@/app/services/dal/organization";
import { CurrentPageProvider } from "@/providers/CurrentPageContext";
import { throwDigestibleError } from "@/utils/errors";
import { parseDocsUrlParam } from "@/utils/parseDocsUrlParam";
import type { EncodedDocsUrl } from "@/utils/types";

function EditorShell({ children }: { children: React.ReactNode }) {
    return <div className="flex w-full flex-col overflow-hidden">{children}</div>;
}

export default async function EditorLayout({
    params,
    children
}: Readonly<{
    params: Promise<{
        orgName: Auth0OrgName;
        docsUrl: EncodedDocsUrl;
        branch: string;
    }>;
    children: React.JSX.Element;
}>) {
    const { orgName, docsUrl: encodedDocsUrl, branch } = await params;
    const docsUrl = parseDocsUrlParam({ docsUrl: encodedDocsUrl });

    await getAuthenticatedSessionOrRedirect(orgName);

    const { githubUrl, session } = await assertAuthAndFetchGithubUrl({
        orgName,
        docsUrl
    });

    const sourceRepo = await getGithubSourceMetadata({
        githubUrl,
        userId: session.user.sub
    });

    if (sourceRepo.owner == null || sourceRepo.repo == null || sourceRepo.baseBranch == null) {
        throw throwDigestibleError(new Error("Source repo is not set"), "REPO_NOT_CONNECTED");
    }

    let branchFailed = false;

    // On first load, create the branch if it doesn't exist. We don't want to await this
    // since it will block the first render.
    createBranchIfNotExists({
        orgName,
        site: docsUrl,
        owner: sourceRepo.owner,
        repo: sourceRepo.repo,
        branch,
        baseBranch: sourceRepo.baseBranch
    })
        .then((result) => {
            if (!result.success) {
                branchFailed = true;
            }
        })
        .catch((e) => {
            console.error("Error creating branch:", {
                error: e,
                orgName,
                owner: sourceRepo?.owner,
                repo: sourceRepo?.repo,
                branch,
                baseBranch: sourceRepo?.baseBranch
            });
            branchFailed = true;
        });

    return (
        <EditorShell>
            <ThemeProvider attribute="class" forcedTheme="light" enableSystem={false} disableTransitionOnChange>
                <OrgNameProvider orgName={orgName}>
                    <BranchProvider branch={branch} branchFailed={branchFailed}>
                        <GitHubRepoProvider branch={branch} sourceRepo={sourceRepo}>
                            <NavigationStoreProvider branchName={branch} orgName={orgName} docsUrl={docsUrl}>
                                <PagesStoreProvider branchName={branch}>
                                    <CurrentPageProvider>
                                        <ClientMDXProvider>
                                            <DevModeProvider>
                                                <EditorProvider>
                                                    <GitPRProvider
                                                        owner={sourceRepo.owner}
                                                        repo={sourceRepo.repo}
                                                        baseBranch={sourceRepo.baseBranch}
                                                        branch={branch}
                                                        site={docsUrl}
                                                    >
                                                        <HeaderToolbar session={session} docsUrl={docsUrl} />
                                                        <PreviewOnlyNotification />
                                                        {children}
                                                    </GitPRProvider>
                                                </EditorProvider>
                                            </DevModeProvider>
                                        </ClientMDXProvider>
                                    </CurrentPageProvider>
                                </PagesStoreProvider>
                            </NavigationStoreProvider>
                        </GitHubRepoProvider>
                    </BranchProvider>
                </OrgNameProvider>
            </ThemeProvider>
        </EditorShell>
    );
}
