import { redirect } from "next/navigation";
import React from "react";

import { getCurrentSession } from "@/app/services/auth0/getCurrentSession";
import { Auth0OrgName } from "@/app/services/auth0/types";
import { validateGithubAccess } from "@/app/services/dal/github";

export declare namespace GithubExtendedAccessProtectedRoute {
  export interface Props {
    orgName: Auth0OrgName;
    githubUrl: string | undefined;
    children: React.JSX.Element;
  }
}

export const GithubExtendedAccessProtectedRoute = async ({
  orgName,
  githubUrl,
  children,
}: GithubExtendedAccessProtectedRoute.Props) => {
  const session = await getCurrentSession();

  if (session == null) {
    redirect("/");
  }

  await validateGithubAccess({
    orgName,
    githubUrl,
    userId: session.user.sub,
  });

  // If we get here, we have validated the repo and have write permission, so we can safely render the children.
  return children;
};
