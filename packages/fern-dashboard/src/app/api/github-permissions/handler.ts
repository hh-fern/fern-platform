import { Octokit } from "@octokit/rest";

import { getCurrentSession } from "@/app/services/auth0/getCurrentSession";
import { getAuth0ManagementClient } from "@/app/services/auth0/management";
import { Auth0UserID } from "@/app/services/auth0/types";

export interface GitHubPermissionsResponse {
  hasRepoAccess: boolean;
  reauthorizeUrl?: string;
  error?: string;
}

export interface CheckRepositoryWritePermissionsParams {
  auth0UserId: Auth0UserID;
  auth0Token: string;
  githubRepoUrl: string;
}

export default async function checkRepositoryWritePermissions(
  params: CheckRepositoryWritePermissionsParams
): Promise<GitHubPermissionsResponse> {
  const { auth0UserId, auth0Token, githubRepoUrl } = params;

  try {
    async function getUsersById(userId: Auth0UserID) {
      const auth0 = getAuth0ManagementClient(auth0Token);
      const user = (await auth0.users.get({ id: userId })).data;
      return user;
    }

    async function getUserGithubToken(userId: Auth0UserID) {
      const user = await getUsersById(userId);

      const githubIdentity = user.identities.find(
        (identity) => identity.provider === "github"
      );

      return githubIdentity?.access_token;
    }

    const githubToken = await getUserGithubToken(auth0UserId);
    console.log("GitHub token:", githubToken);

    if (!githubToken) {
      return {
        hasRepoAccess: false,
        error: "GitHub access token not found",
      };
    }

    // Parse the GitHub repo URL to extract owner and repo name
    const repoUrlMatch = githubRepoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!repoUrlMatch) {
      return {
        hasRepoAccess: false,
        error: "Invalid GitHub repository URL",
      };
    }

    const [, owner, repo] = repoUrlMatch;
    const repoName = repo?.replace(/\.git$/, "") || ""; // Remove .git suffix if present

    // Use Octokit to check repository permissions
    const octokit = new Octokit({
      auth: githubToken,
    });

    try {
      const { data: repoData } = await octokit.repos.get({
        owner: owner ?? "fern-api",
        repo: repoName,
      });

      // Check if user has write permissions
      const hasWritePermission = repoData.permissions?.push === true;

      return {
        hasRepoAccess: hasWritePermission,
        error: hasWritePermission
          ? undefined
          : "User does not have write permissions to this repository",
      };
    } catch (apiError: any) {
      console.error("Error checking GitHub repository permissions:", apiError);
      return {
        hasRepoAccess: false,
        error: "Failed to check repository permissions",
      };
    }
  } catch (error: any) {
    console.error("Error checking repository permissions:", error);
    return {
      hasRepoAccess: false,
      error: "Failed to check repository permissions",
    };
  }
}
