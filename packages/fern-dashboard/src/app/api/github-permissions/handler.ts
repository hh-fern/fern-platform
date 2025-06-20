import { createTokenAuth } from "@octokit/auth-token";
import { request } from "@octokit/request";

import { getCurrentSession } from "@/app/services/auth0/getCurrentSession";
import { getUserGithubToken } from "@/app/services/auth0/management";
import { Auth0UserID } from "@/app/services/auth0/types";

export interface GitHubPermissionsResponse {
  hasRepoAccess: boolean;
  reauthorizeUrl?: string;
  error?: string;
}

// Define the required scopes for repo access
const REQUIRED_SCOPES = ["repo", "read:user", "read:org"];

/**
 * TODO -- FIX THIS:
 * Am thinking that we should have some sort of means to test whether or not a user
 * has given us enough permissions to do what we need. Seems like the JWT isn't getting
 * refreshed properly after more permissions are added, so this always returns false.
 */
export default async function checkGitHubPermissions(
  userId: Auth0UserID
): Promise<GitHubPermissionsResponse> {
  const session = await getCurrentSession();
  // const auth0 = await getAuth0Client();

  try {
    const gitHubToken = await getUserGithubToken(userId);

    console.log("accessToken", session?.accessToken, gitHubToken);
    if (!gitHubToken || !session?.accessToken) {
      return {
        hasRepoAccess: false,
        error: "GitHub not connected",
      };
    }

    // Use @octokit/auth-token to create authentication
    const auth = createTokenAuth(gitHubToken);
    const _authentication = await auth();

    // Make a HEAD request to the GitHub API to get scopes from headers
    const response = await request("HEAD /");

    // Extract scopes from the response headers
    const scopesHeader = response.headers["x-oauth-scopes"];
    if (!scopesHeader) {
      return {
        hasRepoAccess: false,
        error: "No scopes found in token response",
      };
    }

    // Parse the scopes (they come as a comma-separated string)
    const scopes = scopesHeader.split(/,\s+/);

    // Check if all required scopes are present
    const hasAllRequiredScopes = REQUIRED_SCOPES.every((requiredScope) =>
      scopes.includes(requiredScope)
    );

    if (hasAllRequiredScopes) {
      return { hasRepoAccess: true };
    } else {
      // Return a reauthorize URL that will force re-authentication with the required scopes
      const reauthorizeUrl = `/auth/login?connection=github&connection_scope=${REQUIRED_SCOPES.join(",")}`;

      return {
        hasRepoAccess: false,
        reauthorizeUrl,
        error: `Missing required scopes. Required: ${REQUIRED_SCOPES.join(", ")}, Found: ${scopes.join(", ")}`,
      };
    }
  } catch (error: any) {
    console.error("Error checking GitHub permissions:", error);

    // Check if this is the specific refresh token error
    if (
      error.message?.includes("refresh token was not present") ||
      error.message?.includes(
        "Connection Access Token requires a refresh token"
      )
    ) {
      // Return a reauthorize URL that will force re-authentication with the required scopes
      const reauthorizeUrl = `/auth/login?connection=github&connection_scope=${REQUIRED_SCOPES.join(",")}`;

      return {
        hasRepoAccess: false,
        reauthorizeUrl,
        error:
          "GitHub connection needs to be re-authenticated. Please log in again with GitHub.",
      };
    }

    // For other errors, return a generic error
    return {
      hasRepoAccess: false,
      error: "Failed to check GitHub permissions",
    };
  }
}
