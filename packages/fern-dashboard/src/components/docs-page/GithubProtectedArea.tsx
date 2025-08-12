import { redirect } from "next/navigation";

import { checkWritePermissionToRepo } from "@/app/api/github-permissions/handler";
import { getCurrentSession } from "@/app/services/auth0/getCurrentSession";

import { GithubPermissionsProvider } from "./GithubPermissionsContext";

export async function GithubProtectedArea({
  children,
  githubUrl,
}: {
  children: React.ReactNode;
  githubUrl: string | undefined;
}) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/");
  }

  if (!githubUrl) {
    return <div>No github repo</div>;
  }

  let writePermission = false;

  if (githubUrl) {
    try {
      writePermission = await checkWritePermissionToRepo(
        session.user.sub,
        githubUrl
      );
    } catch (_error) {
      writePermission = false;
    }
  }

  return (
    <GithubPermissionsProvider writePermission={writePermission}>
      {children}
    </GithubPermissionsProvider>
  );
}
