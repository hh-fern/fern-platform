import { redirect } from "next/navigation";
import React from "react";

import { getCurrentSession } from "@/app/services/auth0/getCurrentSession";
import { assertGithubAccessByUrl } from "@/app/services/dal/github/validators";

export declare namespace GithubExtendedAccessProtectedRoute {
  export interface Props {
    githubUrl: string | undefined;
    children: React.JSX.Element;
  }
}

export const GithubExtendedAccessProtectedRoute = async ({
  githubUrl,
  children,
}: GithubExtendedAccessProtectedRoute.Props) => {
  const session = await getCurrentSession();

  if (session == null) {
    redirect("/");
  }

  await assertGithubAccessByUrl(session.user.sub, githubUrl);

  // If we get here, we have validated the repo and have write permission, so we can safely render the children.
  return children;
};
