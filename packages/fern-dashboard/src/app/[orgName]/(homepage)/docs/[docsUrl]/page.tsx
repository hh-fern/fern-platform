import "server-only";

import { redirect } from "next/navigation";

import getGithubSourceMetadataHandler from "@/app/api/get-github-source-metadata/handler";
import getMyDocsSitesHandler from "@/app/api/get-my-docs-sites/handler";
import { getCurrentSession } from "@/app/services/auth0/getCurrentSession";
import { Auth0OrgName } from "@/app/services/auth0/types";
import getDocsGithubUrl from "@/app/services/dal/github/getDocsGithubUrl";
import { validateGithubRepoAccess } from "@/app/services/dal/github/validators";
import { DocsSiteOverviewCard } from "@/components/docs-page/DocsSiteOverviewCard";
import {
  GithubAuthState,
  GithubSource,
} from "@/components/docs-page/GithubSource";
import { VisualEditorSection } from "@/components/docs-page/VisualEditorSection";
import { PosthogFeatureFlag } from "@/components/posthog/feature-flags/flags";
import {
  FeatureFlaggedServerSide,
  isFeatureFlagEnabledForUser,
} from "@/components/posthog/feature-flags/server-side";
import { getDocsSiteUrl } from "@/utils/getDocsSiteUrl";
import { parseDocsUrlParam } from "@/utils/parseDocsUrlParam";
import { EncodedDocsUrl } from "@/utils/types";

export default async function Page(props: {
  params: Promise<{ orgName: Auth0OrgName; docsUrl: EncodedDocsUrl }>;
}) {
  // Validate session
  const session = await getCurrentSession();
  if (session == null) {
    redirect("/");
  }

  const { orgName, docsUrl: encodedDocsUrl } = await props.params;
  const docsUrl = parseDocsUrlParam({ docsUrl: encodedDocsUrl });

  // Validate that the docsUrl belongs to this organization so that we avoid errors in the page
  try {
    const docsSites = await getMyDocsSitesHandler({
      orgName,
      token: session.accessToken,
    });

    const docsUrlsInOrg = docsSites.docsSites.map((site) =>
      getDocsSiteUrl(site)
    );
    const isValidDocsUrl = docsUrlsInOrg.includes(docsUrl);

    if (!isValidDocsUrl) {
      redirect(`/${orgName}/docs`);
    }
  } catch (error) {
    console.error("Failed to validate docs url", error);
    // If we can't validate (e.g., permission issues), redirect to docs overview
    redirect(`/${orgName}/docs`);
  }

  let githubUrl = undefined;
  let githubAuthState: GithubAuthState = {
    validationResult: {
      ok: false,
      error: {
        type: "UNEXPECTED_ERROR",
        message: "",
      },
    },
    sourceRepo: undefined,
    isLoading: false,
  };

  try {
    const urlResult = await getDocsGithubUrl({
      url: encodedDocsUrl,
      token: session.accessToken,
    });

    githubUrl = urlResult.success ? urlResult.githubUrl : undefined;

    // If we have a GitHub URL, validate the auth state
    if (githubUrl) {
      try {
        const validation = await validateGithubRepoAccess(orgName, {
          type: "url",
          githubUrl,
        });

        let sourceRepo = undefined;

        // If user has all required access, fetch the source repo metadata
        if (validation.ok) {
          try {
            sourceRepo = await getGithubSourceMetadataHandler({
              githubUrl,
              userId: session.user.sub,
              skipCache: false,
            });
          } catch (error) {
            console.error("Failed to fetch source repo metadata:", error);
          }
        }

        githubAuthState = {
          validationResult: validation,
          sourceRepo,
          isLoading: false,
        };
      } catch (error) {
        console.error("Failed to validate GitHub access:", error);
        // Keep default false state
      }
    }
  } catch (error) {
    console.error(error);
  }

  const isVEBranchPRsEnabled = await isFeatureFlagEnabledForUser(
    PosthogFeatureFlag.ENABLE_VE_BRANCH_PRS,
    session.user.sub,
    orgName
  );

  return (
    <FeatureFlaggedServerSide
      flag={PosthogFeatureFlag.ENABLE_DOCS_PAGE}
      redirectWhenDisabled
      orgName={orgName}
    >
      <div className="flex w-full flex-col gap-4">
        <DocsSiteOverviewCard
          docsUrl={docsUrl}
          githubProtectedArea={
            <div className="flex w-fit flex-col gap-2">
              <p>Source</p>
              <GithubSource docsUrl={docsUrl} githubUrl={githubUrl} />
            </div>
          }
        />

        <VisualEditorSection
          docsUrl={docsUrl}
          session={session}
          githubAuthState={githubAuthState}
          githubUrl={githubUrl}
          isVEBranchPRsEnabled={isVEBranchPRsEnabled ?? false}
        />
      </div>
    </FeatureFlaggedServerSide>
  );
}
