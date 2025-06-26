import jwt from "jsonwebtoken";

import { getCurrentSession } from "@/app/services/auth0/getCurrentSession";
import { Auth0UserID } from "@/app/services/auth0/types";
import { getAuth0ManagementClient } from "@/app/services/auth0/management";

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
  _userId: Auth0UserID
): Promise<GitHubPermissionsResponse> {
  const session = await getCurrentSession();

  if (!session?.accessToken) {
    return {
      hasRepoAccess: false,
      error: "GitHub not connected",
    };
  }

  try {
    async function getUsersById(userId: Auth0UserID) {
      const auth0 = getAuth0ManagementClient();
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

    const githubToken = await getUserGithubToken(_userId);
    console.log("GitHub token:", githubToken);

    if (!githubToken) {
      return {
        hasRepoAccess: false,
        error: "GitHub access token not found",
      };
    }

    // Decode the GitHub JWT token to check scopes
    const decodedGitHubToken = jwt.decode(githubToken);
    console.log("decodedGitHubToken", decodedGitHubToken);

    if (!decodedGitHubToken || typeof decodedGitHubToken !== "object") {
      return {
        hasRepoAccess: false,
        error: "Invalid GitHub access token",
      };
    }

    // Check if the GitHub token has the required scopes
    // The scopes might be in different fields depending on the token structure
    const scopes =
      decodedGitHubToken.scope || decodedGitHubToken.scp || decodedGitHubToken.permissions || [];

    // Convert to array if it's a string (space-separated)
    const scopeArray = typeof scopes === "string" ? scopes.split(" ") : scopes;

    console.log("GitHub token scopes:", scopeArray);

    // Check if all required scopes are present
    const hasAllRequiredScopes = REQUIRED_SCOPES.every((requiredScope) =>
      scopeArray.includes(requiredScope)
    );

    if (hasAllRequiredScopes) {
      return { hasRepoAccess: true };
    } else {
      // Return a reauthorize URL that will force re-authentication with the required scopes
      const reauthorizeUrl = `/auth/login?connection=github&connection_scope=${REQUIRED_SCOPES.join(",")}`;

      return {
        hasRepoAccess: false,
        reauthorizeUrl,
        error: `Missing required scopes. Required: ${REQUIRED_SCOPES.join(", ")}, Found: ${scopeArray.join(", ")}`,
      };
    }
  } catch (error: any) {
    console.error("Error decoding access token:", error);
    return {
      hasRepoAccess: false,
      error: "Failed to decode access token",
    };
  }
}
