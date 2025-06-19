import { redirect } from "next/navigation";
import React from "react";

import { getExtendedAccessGithubAuth0Client } from "@/app/services/auth0/auth0";
import { getCurrentSession } from "@/app/services/auth0/getCurrentSession";
import * as auth0Management from "@/app/services/auth0/management";
import { Auth0OrgName } from "@/app/services/auth0/types";

import { Page404 } from "../Page404";

export declare namespace GithubExtendedAccessProtectedRoute {
  export interface Props {
    orgName: Auth0OrgName;
    children: React.JSX.Element;
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

  await getExtendedAccessGithubAuth0Client();
  const isUserInOrgFromUrl = await auth0Management.doesUserBelongsToOrg(
    session.user.sub,
    orgName
  );

  if (!isUserInOrgFromUrl) {
    return <Page404 />;
  }

  return children;
};
