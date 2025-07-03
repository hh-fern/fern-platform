"use client";

import { getLoadableValue } from "@fern-ui/loadable";

import { useDocsSite } from "@/state/useMyDocsSites";
import { DocsUrl } from "@/utils/types";

import Card from "../ui/card";
import { DocsSiteLink } from "./DocsSiteLink";
import { DocsSiteImage } from "./docs-site-image/DocsSiteImage";
import { SkeletonDocsSiteImage } from "./docs-site-image/SkeletonDocsSiteImage";

/**
function CreateBranchButton({
  orgName,
  docsUrl,
  session,
  sourceRepo,
}: {
  orgName: Auth0OrgName;
  docsUrl: DocsUrl;
  session: Auth0SessionData;
  sourceRepo: any;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const createBranch = useCallback(async () => {
    if (sourceRepo?.owner == null || sourceRepo.repo == null) {
      return;
    }
    const randomHexString = crypto.randomUUID().split("-")[0];

    const branchName =
      new Date().toISOString().split("T")[0] +
      "-" +
      session.user.name?.toLowerCase().replace(" ", "_") +
      "-" +
      randomHexString;
    console.log("branchName", branchName);

    const response = await DashboardApiClient.postCreateBranch({
      owner: sourceRepo.owner,
      repo: sourceRepo.repo,
      branch: branchName,
      baseBranch: "main",
    });
    if (response.success === false) {
      toast.error("Failed to create branch");
      setIsLoading(false);
      return;
    }
    router.push(`/${orgName}/editor/${docsUrl}/${branchName}/root`);
    setIsLoading(false);
  }, [sourceRepo, session.user.name, orgName, docsUrl, router]);

  return (
    <Button
      variant="outline"
      size="sm"
      className="text-primary hover:text-primary"
      onClick={() => {
        setIsLoading(true);
        void createBranch();
      }}
      disabled={isLoading}
    >
      <PencilSquareIcon className="text-primary" />
      Create a Branch
    </Button>
  );
}

function GithubProtectedButton({
  orgName,
  docsUrl,
  session,
  sourceRepo,
  hasRepoAccess,
  writePermission,
}: {
  orgName: Auth0OrgName;
  docsUrl: DocsUrl;
  session: Auth0SessionData;
  sourceRepo: any;
  hasRepoAccess: boolean;
  writePermission: boolean | undefined;
}) {
  if (!writePermission) {
    return (
      <div className="flex items-center gap-2 text-red-600">
        <ExclamationCircleIcon className="h-4 w-4" />
        <p>You do not have write permission to this repo</p>
      </div>
    );
  }

  if (!hasRepoAccess) {
    return (
      <LoginButton
        additionalParams={{
          connection: "github",
          connection_scope: "read:user,read:org,repo",
        }}
      />
    );
  }

  return (
    <CreateBranchButton
      orgName={orgName}
      docsUrl={docsUrl}
      session={session}
      sourceRepo={sourceRepo}
    />
  );
} */

export declare namespace DocsSiteOverviewCard {
  export interface Props {
    docsUrl: DocsUrl;
    githubProtectedArea: React.ReactNode;
  }
}

export function DocsSiteOverviewCard({
  docsUrl,
  githubProtectedArea,
}: DocsSiteOverviewCard.Props) {
  const docsSite = getLoadableValue(useDocsSite(docsUrl));

  return (
    <div className="flex w-full flex-col gap-4">
      <Card className="flex flex-col md:flex-row">
        {docsSite != null ? (
          <DocsSiteImage docsSite={docsSite} />
        ) : (
          <SkeletonDocsSiteImage />
        )}
        {docsSite != null && (
          <div className="flex min-w-0 flex-col gap-4 text-gray-900">
            <div className="flex flex-col gap-2">
              <p>Domains</p>
              <div className="flex flex-col items-start gap-1">
                {docsSite.urls.map((url) => (
                  <DocsSiteLink
                    key={`${url.domain}${url.path}`}
                    docsSiteUrl={url}
                  />
                ))}
              </div>
            </div>
            {githubProtectedArea}
          </div>
        )}
      </Card>

      {/* 
      TODO: Add open branches here once we have a way to preview branches
      {sourceRepo?.repoName != null && sourceRepo.owner != null && (
        <Card className="flex flex-col gap-2">
          <div className="flex flex-row items-center justify-between">
            <p>
              <b>Open Pull Requests</b>
            </p>
            <GithubProtectedButton
              orgName={orgName}
              docsUrl={docsUrl}
              session={session}
              sourceRepo={sourceRepo}
              hasRepoAccess={hasRepoAccess}
              writePermission={writePermission}
            />
          </div>
          <p className="text-gray-1100 text-sm">TODO: List PRs</p>
        </Card>
      )} */}
    </div>
  );
}
