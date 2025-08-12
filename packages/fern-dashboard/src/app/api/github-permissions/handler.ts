import { getFernBotOctokitForRepo } from "@/app/services/auth0/fernBotOctokit";
import { getUserOctokit } from "@/app/services/auth0/octokit";
import { Auth0UserID } from "@/app/services/auth0/types";
import { getOwnerAndRepoFromGithubUrl } from "@/app/services/github/github";

export interface GitHubPermissionsResponse {
  hasRepoAccess: boolean;
  error?: string;
}
const REQUIRED_SCOPES = ["repo", "read:user", "read:org"];

/**
 * @deprecated
 */
export default async function checkGitHubPermissions(
  userId: Auth0UserID
): Promise<GitHubPermissionsResponse> {
  const octokit = await getUserOctokit(userId);
  if (octokit == null) {
    return {
      hasRepoAccess: false,
      error: "Github access token not found",
    };
  }
  const response = await octokit.request("GET /user");
  const scopesHeader = response.headers["x-oauth-scopes"];
  if (!scopesHeader) {
    return {
      hasRepoAccess: false,
      error: "Missing scopes header",
    };
  }
  const actualScopes = scopesHeader.split(",").map((s) => s.trim());
  const missing = REQUIRED_SCOPES.filter(
    (scope) => !actualScopes.includes(scope)
  );
  if (missing.length > 0) {
    return {
      hasRepoAccess: false,
      error: "Missing required scopes",
    };
  }
  return {
    hasRepoAccess: true,
  };
}

export async function checkWritePermissionToRepo(
  userId: Auth0UserID,
  githubUrl: string
) {
  const { owner, repo } = getOwnerAndRepoFromGithubUrl(githubUrl);
  if (owner == null || repo == null) {
    return false;
  }

  const userOctokit = await getUserOctokit(userId);
  if (userOctokit == null) {
    return false;
  }

  let username: string;
  try {
    const userResponse = await userOctokit.request("GET /user");
    username = userResponse.data.login;
  } catch (_error) {
    return false;
  }

  // Use Fern bot to check permissions

  const fernBotOctokit = await getFernBotOctokitForRepo(owner, repo);
  if (fernBotOctokit == null) {
    return false;
  }

  try {
    // First try checking if user is a collaborator with push permissions
    const collaboratorResponse = await fernBotOctokit.request(
      "GET /repos/{owner}/{repo}/collaborators/{username}/permission",
      {
        owner,
        repo,
        username,
      }
    );

    const permission = collaboratorResponse.data.permission;

    const hasWriteAccess = permission === "admin" || permission === "write";

    return hasWriteAccess;
  } catch (_error: any) {
    // Try checking organization membership and permissions
    try {
      await fernBotOctokit.request("GET /orgs/{org}/members/{username}", {
        org: owner,
        username,
      });

      // Check if the user can push to repositories in this org
      try {
        const membershipResponse = await fernBotOctokit.request(
          "GET /orgs/{org}/memberships/{username}",
          {
            org: owner,
            username,
          }
        );

        const membership = membershipResponse.data;
        if (membership.role === "admin" || membership.role === "member") {
          return true;
        }
      } catch (_membershipError: any) {
        return false;
      }
    } catch (_orgError: any) {
      return false;
    }
    return false;
  }
}
