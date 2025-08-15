import "server-only";

import { ThemeProvider } from "next-themes";
import { redirect } from "next/navigation";
import type React from "react";

import { ClientPageManager } from "@fern-docs/components/sidebar/nodes/ClientPageManager";
import { SidebarClientNavigationProvider } from "@fern-docs/components/sidebar/nodes/SidebarClientNavigationProvider";

import getGithubSourceMetadata from "@/app/api/get-github-source-metadata/handler";
import { getCurrentSession } from "@/app/services/auth0/getCurrentSession";
import type { Auth0OrgName } from "@/app/services/auth0/types";
import getDocsGithubUrl from "@/app/services/dal/github/getDocsGithubUrl";
import { assertGithubAccessByUrl } from "@/app/services/dal/github/validators";
import { assertUserHasOrganizationAccess } from "@/app/services/dal/organization";
import { HeaderToolbar } from "@/components/editor/HeaderToolbar";
import { BranchProvider } from "@/providers/BranchContext";
import { CurrentPageProvider } from "@/providers/CurrentPageContext";
import { DevModeProvider } from "@/providers/DevModeProvider";
import { EditorProvider } from "@/providers/EditorContext";
import { GitHubRepoProvider } from "@/providers/GitHubRepoContext";
import { GitPRProvider } from "@/providers/GitPRContext";
import { MdxStateProvider } from "@/providers/MdxStateContext";
import { parseDocsUrlParam } from "@/utils/parseDocsUrlParam";
import type { EncodedDocsUrl } from "@/utils/types";

export const experimental_ppr = true;

function EditorShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background noise flex w-full flex-col overflow-hidden">
      {children}
    </div>
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
  await assertUserHasOrganizationAccess({
    userId: session.user.sub,
    orgName,
  });

  const urlResult = await getDocsGithubUrl({
    url: docsUrl,
    token: session.accessToken,
  });
  if (!urlResult.success) {
    redirect(`/${orgName}/docs`);
  }
  const { githubUrl } = urlResult;

  await assertGithubAccessByUrl(session.user.sub, githubUrl);

  const sourceRepo = await getGithubSourceMetadata({
    githubUrl,
    userId: session.user.sub,
  });

  return (
    <EditorShell>
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
    </EditorShell>
  );
}
