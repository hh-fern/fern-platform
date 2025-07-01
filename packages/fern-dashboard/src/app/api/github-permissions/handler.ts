import { Octokit } from "@octokit/rest";

import { getUserGithubToken } from "@/app/services/auth0/management";
import { Auth0UserID } from "@/app/services/auth0/types";

export interface GitHubPermissionsResponse {
  hasRepoAccess: boolean;
  error?: string;
}
const REQUIRED_SCOPES = ["repo", "read:user", "read:org"];

export default async function checkGitHubPermissions(
  userId: Auth0UserID
): Promise<GitHubPermissionsResponse> {
  const gitHubToken = await getUserGithubToken(userId);
  if (!gitHubToken) {
    return {
      hasRepoAccess: false,
      error: "GitHub access token not found",
    };
  }
  const octokit = new Octokit({ auth: gitHubToken });
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
