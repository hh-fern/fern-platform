import { redirect } from "next/navigation";
import getDocsGithubSourceHandler from "@/app/api/get-docs-github-source/handler";
import checkGitHubPermissions, {
  checkWritePermissionToRepo,
} from "@/app/api/github-permissions/handler";
import { getCurrentSession } from "@/app/services/auth0/getCurrentSession";
import { Auth0OrgName } from "@/app/services/auth0/types";
import { DocsSiteOverviewCard } from "@/components/docs-page/DocsSiteOverviewCard";
import { PosthogFeatureFlag } from "@/components/posthog/feature-flags/flags";
import { FeatureFlaggedServerSide } from "@/components/posthog/feature-flags/server-side";

import { parseDocsUrlParam } from "../../../../../utils/parseDocsUrlParam";

export default async function Page(props: {
  params: Promise<{ orgName: Auth0OrgName; docsUrl: string }>;
}) {
  const { orgName, docsUrl: docsUrlParam } = await props.params;
  const docsUrl = parseDocsUrlParam({ docsUrl: docsUrlParam });
  const session = await getCurrentSession();

  if (!session) {
    redirect("/");
  }

  const githubPermissions = await checkGitHubPermissions(session.user.sub);
  const sourceRepo = await getDocsGithubSourceHandler({
    url: docsUrl,
    token: session.accessToken,
    userId: session.user.sub,
  });

  const writePermission =
    sourceRepo?.owner && sourceRepo?.repo
      ? await checkWritePermissionToRepo(
          session.user.sub,
          sourceRepo.owner,
          sourceRepo.repo
        )
      : undefined;


  return (
    <FeatureFlaggedServerSide
      flag={PosthogFeatureFlag.ENABLE_DOCS_PAGE}
      redirectWhenDisabled
    >
      <DocsSiteOverviewCard
        orgName={orgName}
        docsUrl={docsUrl}
        session={session}
        hasRepoAccess={githubPermissions.hasRepoAccess}
        writePermission={writePermission}
        sourceRepo={sourceRepo}
      />
    </FeatureFlaggedServerSide>
  );
}
