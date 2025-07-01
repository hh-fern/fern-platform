import { redirect } from "next/navigation";
import React from "react";

import checkGitHubPermissions, { checkWritePermissionToRepo } from "@/app/api/github-permissions/handler";
import { getCurrentSession } from "@/app/services/auth0/getCurrentSession";
import * as auth0Management from "@/app/services/auth0/management";
import { Auth0OrgName } from "@/app/services/auth0/types";

import { Page404 } from "../Page404";
import { LoginButton } from "./LoginButton";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

export declare namespace GithubExtendedAccessProtectedRoute {
  export interface Props {
    orgName: Auth0OrgName;
    owner: string | undefined;
    repo: string | undefined;
    children: React.JSX.Element;
    requireRepoAccess?: boolean;
  }
}

export const GithubExtendedAccessProtectedRoute = async ({
  orgName,
  owner,
  repo,
  children,
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
    return <Page404 />;
  }

  if (owner && repo) {
    const writePermission = await checkWritePermissionToRepo(session.user.sub, owner, repo);
    if (!writePermission) {
      return (
        <div className="flex items-center gap-2 text-red-600">
          <ExclamationCircleIcon className="h-4 w-4" />
          <p>You do not have write permission to this repo</p>
        </div>
      );
    }
  }

  const { hasRepoAccess } = await checkGitHubPermissions(session.user.sub);
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

  return children;
};
