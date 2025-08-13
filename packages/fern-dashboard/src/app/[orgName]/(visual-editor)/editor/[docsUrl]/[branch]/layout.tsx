import { ThemeProvider } from "next-themes";
import { redirect } from "next/navigation";
import type React from "react";

import { ClientPageManager } from "@fern-docs/components/sidebar/nodes/ClientPageManager";
import { SidebarClientNavigationProvider } from "@fern-docs/components/sidebar/nodes/SidebarClientNavigationProvider";

import getDocsGithubUrl from "@/app/api/get-docs-github-url/handler";
import getGithubSourceMetadata from "@/app/api/get-github-source-metadata/handler";
import {
  Auth0SessionData,
  getCurrentSession,
} from "@/app/services/auth0/getCurrentSession";
import type { Auth0OrgName } from "@/app/services/auth0/types";
import { GithubSourceRepo } from "@/app/services/github/types";
import { GithubExtendedAccessProtectedRoute } from "@/components/auth/GithubExtendedAccessProtectedRoute";
import { HeaderToolbar } from "@/components/editor/HeaderToolbar";
import { BranchProvider } from "@/providers/BranchContext";
import { CurrentPageProvider } from "@/providers/CurrentPageContext";
import { DevModeProvider } from "@/providers/DevModeProvider";
import { EditorProvider } from "@/providers/EditorContext";
import { GitHubRepoProvider } from "@/providers/GitHubRepoContext";
import { GitPRProvider } from "@/providers/GitPRContext";
import { MdxStateProvider } from "@/providers/MdxStateContext";
import { parseDocsUrlParam } from "@/utils/parseDocsUrlParam";
import type { DocsUrl, EncodedDocsUrl } from "@/utils/types";

export const experimental_ppr = true;

// Static shell that renders immediately
function EditorShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background noise flex w-full flex-col overflow-hidden">
      {children}
    </div>
  );
}

// Only the dynamic parts that need data fetching
async function DynamicEditorContent({
  orgName,
  docsUrl,
  branch,
  session,
  children,
}: {
  orgName: Auth0OrgName;
  docsUrl: DocsUrl;
  branch: string;
  session: Auth0SessionData;
  children: React.JSX.Element;
}) {
  let githubUrl: string | undefined = undefined;
  let sourceRepo: GithubSourceRepo | undefined;

  try {
    githubUrl = await getDocsGithubUrl({
      url: docsUrl,
      token: session.accessToken,
    });
    sourceRepo = await getGithubSourceMetadata({
      githubUrl,
      userId: session.user.sub,
    });
  } catch (_error) {
    // Silently fail, as the route guard will handle the error
  }

  return (
    <GithubExtendedAccessProtectedRoute
      orgName={orgName}
      githubUrl={githubUrl}
      sourceRepo={sourceRepo}
    >
      <>
        {sourceRepo && githubUrl && (
          <ThemeProvider
            attribute="class"
            forcedTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
            <GitHubRepoProvider
              owner={sourceRepo.owner ?? ""}
              repo={sourceRepo.repo ?? ""}
              branch={branch}
            >
              <SidebarClientNavigationProvider branchName={branch}>
                <ClientPageManager branchName={branch} />
                <DevModeProvider>
                  <MdxStateProvider docsUrl={docsUrl}>
                    <CurrentPageProvider>
                      <BranchProvider branch={branch}>
                        <EditorProvider>
                          <GitPRProvider
                            owner={sourceRepo.owner}
                            repo={sourceRepo.repo}
                            baseBranch={sourceRepo.baseBranch}
                            branch={branch}
                            orgName={orgName}
                          >
                            <HeaderToolbar
                              orgName={orgName}
                              session={session}
                              docsUrl={docsUrl}
                              githubUrl={githubUrl}
                            />
                            {children}
                          </GitPRProvider>
                        </EditorProvider>
                      </BranchProvider>
                    </CurrentPageProvider>
                  </MdxStateProvider>
                </DevModeProvider>
              </SidebarClientNavigationProvider>
            </GitHubRepoProvider>
          </ThemeProvider>
        )}
      </>
    </GithubExtendedAccessProtectedRoute>
  );
}

export default async function EditorLayout({
  params,
  children,
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

  const session = await getCurrentSession();
  if (!session) {
    redirect("/");
  }

  return (
    <EditorShell>
      <DynamicEditorContent
        orgName={orgName}
        docsUrl={docsUrl}
        branch={branch}
        session={session}
      >
        {children}
      </DynamicEditorContent>
    </EditorShell>
  );
}
