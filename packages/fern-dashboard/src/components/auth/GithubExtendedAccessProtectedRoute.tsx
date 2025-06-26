import { redirect } from "next/navigation";
import React from "react";

import checkGitHubPermissions from "@/app/api/github-permissions/handler";
import { getCurrentSession } from "@/app/services/auth0/getCurrentSession";
import * as auth0Management from "@/app/services/auth0/management";
import { Auth0OrgName } from "@/app/services/auth0/types";

import { Page404 } from "../Page404";
import { LoginButton } from "./LoginButton";

export declare namespace GithubExtendedAccessProtectedRoute {
  export interface Props {
    orgName: Auth0OrgName;
    children: React.JSX.Element;
    requireRepoAccess?: boolean;
  }
}

export const GithubExtendedAccessProtectedRoute = async ({
  orgName,
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

  // TODO: hasRepoAccess is always false, so this needs to be fixed.
  console.log("Checking GitHub permissions for user:", session.user.sub);
  const { hasRepoAccess, error, reauthorizeUrl } = await checkGitHubPermissions(session.user.sub);
  console.log("GitHub permissions result:", { hasRepoAccess, error, reauthorizeUrl });

  if (!hasRepoAccess) {
    console.log("User does not have required GitHub permissions, showing reauthorization button");
    return (
      <LoginButton
        additionalParams={{
          scope: "repo read:user read:org",
        }}
      />
    );
  }

  console.log("User has required GitHub permissions, rendering children");
  return children;
};
