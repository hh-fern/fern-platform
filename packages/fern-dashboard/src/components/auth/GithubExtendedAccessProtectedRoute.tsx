import { redirect } from "next/navigation";
import React from "react";

import { checkWritePermissionToRepo } from "@/app/api/github-permissions/handler";
import { getCurrentSession } from "@/app/services/auth0/getCurrentSession";
import * as auth0Management from "@/app/services/auth0/management";
import { Auth0OrgName } from "@/app/services/auth0/types";
import { GithubSourceRepo } from "@/app/services/github/types";
import { throwDigestibleError } from "@/utils/errors";

export declare namespace GithubExtendedAccessProtectedRoute {
  export interface Props {
    orgName: Auth0OrgName;
    githubUrl: string | undefined;
    children: React.JSX.Element;
    sourceRepo?: GithubSourceRepo;
  }
}

export const GithubExtendedAccessProtectedRoute = async ({
  orgName,
  githubUrl,
  children,
  sourceRepo,
}: GithubExtendedAccessProtectedRoute.Props) => {
  const session = await getCurrentSession();

  if (session == null) {
    redirect("/");
  }

  const isUserInOrgFromUrl = await auth0Management.doesUserBelongsToOrg(
    session.user.sub,
    orgName
  );

  if (!isUserInOrgFromUrl) {
    throwDigestibleError(
      new Error(`User does not have access to the ${orgName} organization.`),
      "USER_NOT_IN_ORG"
    );
  }

  if (!githubUrl) {
    throwDigestibleError(
      new Error("Domain does not have a linked GitHub repo."),
      "SOURCE_REPO_NOT_FOUND"
    );
  }

  if (!sourceRepo?.fernBotHasInstallationId) {
    throwDigestibleError(
      new Error("Fern bot is not installed on this repo."),
      "FERN_BOT_NOT_INSTALLED"
    );
  }

  if (sourceRepo?.owner == null || sourceRepo?.repo == null) {
    throwDigestibleError(
      new Error("Source repo did not have an owner or repo"),
      "SOURCE_REPO_NOT_VALID"
    );
  }

  if (sourceRepo?.baseBranch == null) {
    throwDigestibleError(
      new Error("Source repo does not have a base branch"),
      "BASE_BRANCH_NOT_SET"
    );
  }

  if (githubUrl) {
    try {
      const writePermission = await checkWritePermissionToRepo(
        session.user.sub,
        githubUrl
      );

      // throw error if write permission is not granted so that we handle this the same way as other errors
      if (!writePermission) {
        throw new Error("User does not have write permission to this repo.");
      }
    } catch (error) {
      throwDigestibleError(error as Error, "WRITE_PERMISSION_ERROR");
    }
  }

  // If we get here, we have validated the repo and have write permission, so we can safely render the children.
  return children;
};
