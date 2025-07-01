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
  const hasRepoAccess = await checkGitHubPermissions(session.user.sub);
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
