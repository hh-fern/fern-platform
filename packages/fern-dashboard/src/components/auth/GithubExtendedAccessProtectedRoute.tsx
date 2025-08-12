import { redirect } from "next/navigation";
import React from "react";

import { checkWritePermissionToRepo } from "@/app/api/github-permissions/handler";
import { getCurrentSession } from "@/app/services/auth0/getCurrentSession";
import * as auth0Management from "@/app/services/auth0/management";
import { Auth0OrgName } from "@/app/services/auth0/types";

import { Page404 } from "../Page404";

export declare namespace GithubExtendedAccessProtectedRoute {
  export interface Props {
    orgName: Auth0OrgName;
    githubUrl: string;
    children: React.JSX.Element;
    fernBotInstalled: boolean | undefined;
  }
}

export const GithubExtendedAccessProtectedRoute = async ({
  orgName,
  githubUrl,
  children,
  fernBotInstalled,
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

  if (!githubUrl) {
    return <div>No github url provided.</div>;
  }

  if (githubUrl) {
    if (!fernBotInstalled) {
      return <div>Fern bot is not installed on this repo.</div>;
    }
    try {
      const writePermission = await checkWritePermissionToRepo(
        session.user.sub,
        githubUrl
      );

      if (!writePermission) {
        return <div>You don&apos;t have write permission to this repo.</div>;
      }
    } catch (error) {
      console.error(error);
      return <div>Error checking write permission.</div>;
    }
  }

  return children;
};
