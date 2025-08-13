import { NextResponse } from "next/server";
import { cache } from "react";

import { checkWritePermissionToRepo } from "@/app/api/github-permissions/handler";
import { Auth0OrgName, Auth0UserID } from "@/app/services/auth0/types";
import { throwDigestibleError } from "@/utils/errors";

import { verifyUserHasOrganizationAccess } from "./organization";

type RepoIdentifier =
  | {
      type: "owner-repo";
      owner: string;
      repo: string;
    }
  | {
      type: "url";
      githubUrl: string;
    };

interface GithubRepoValidation {
  hasWriteAccess: boolean;
  hasFernBotInstalled: boolean;
  repoExists: boolean;
}

// Cache for GitHub repo validation results
const githubValidationCache = new Map<
  string,
  { data: GithubRepoValidation; timestamp: number }
>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCacheKey(userId: Auth0UserID, identifier: RepoIdentifier): string {
  const repoKey =
    identifier.type === "url"
      ? identifier.githubUrl
      : `${identifier.owner}/${identifier.repo}`;
  return `${userId}:${repoKey}`;
}

function deriveGithubUrl(identifier: RepoIdentifier): string {
  if (identifier.type === "url") {
    return identifier.githubUrl;
  }
  return `https://github.com/${identifier.owner}/${identifier.repo}`;
}

const validateGithubRepoAccess = cache(
  async (
    userId: Auth0UserID,
    identifier: RepoIdentifier
  ): Promise<GithubRepoValidation> => {
    const cacheKey = getCacheKey(userId, identifier);
    const cached = githubValidationCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    const githubUrl = deriveGithubUrl(identifier);

    try {
      // Check write permissions (this also validates repo exists and user has access)
      const hasWriteAccess = await checkWritePermissionToRepo(
        userId,
        githubUrl
      );

      // For now, assume Fern bot is installed if we have write access
      // This can be enhanced later with actual Fern bot installation check
      const hasFernBotInstalled = hasWriteAccess;

      const validation: GithubRepoValidation = {
        hasWriteAccess,
        hasFernBotInstalled,
        repoExists: true,
      };

      // Cache the result
      githubValidationCache.set(cacheKey, {
        data: validation,
        timestamp: Date.now(),
      });

      return validation;
    } catch (_error) {
      const validation: GithubRepoValidation = {
        hasWriteAccess: false,
        hasFernBotInstalled: false,
        repoExists: false,
      };

      // Cache negative results for shorter duration
      githubValidationCache.set(cacheKey, {
        data: validation,
        timestamp: Date.now() - CACHE_DURATION / 2,
      });

      return validation;
    }
  }
);

export interface GithubAccessValidationOptions {
  orgName: Auth0OrgName;
  userId: Auth0UserID;
  owner?: string;
  repo?: string;
  githubUrl?: string;
}

export async function validateGithubAccess(
  options: GithubAccessValidationOptions
): Promise<void> {
  const { orgName, userId, owner, repo, githubUrl } = options;

  // Validate user organization access
  await verifyUserHasOrganizationAccess({
    userId,
    orgName,
  });

  // Determine repo identifier
  if (!githubUrl && (!owner || !repo)) {
    throw throwDigestibleError(
      new Error("Either githubUrl or both owner and repo must be provided"),
      "INVALID_REPO_IDENTIFIER"
    );
  }

  const repoIdentifier: RepoIdentifier = githubUrl
    ? { type: "url", githubUrl }
    : // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      { type: "owner-repo", owner: owner!, repo: repo! };

  // Validate GitHub repo access
  const validation = await validateGithubRepoAccess(userId, repoIdentifier);

  if (!validation.repoExists) {
    throw throwDigestibleError(
      new Error("GitHub repository not found or not accessible"),
      "REPO_NOT_FOUND"
    );
  }

  if (!validation.hasWriteAccess) {
    throw throwDigestibleError(
      new Error("User does not have write permission to this repo"),
      "WRITE_PERMISSION_ERROR"
    );
  }

  if (!validation.hasFernBotInstalled) {
    throw throwDigestibleError(
      new Error("Fern bot is not installed on this repo"),
      "FERN_BOT_NOT_INSTALLED"
    );
  }
}

export interface ApiGithubAccessValidationOptions
  extends GithubAccessValidationOptions {
  userId: Auth0UserID;
}

export async function validateApiGithubAccess(
  options: ApiGithubAccessValidationOptions
): Promise<NextResponse | null> {
  try {
    await validateGithubAccess(options);
    return null; // No error
  } catch (error) {
    // Return appropriate error response for API routes
    const statusCode =
      error instanceof Error && error.message.includes("not authenticated")
        ? 401
        : 403;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Access denied" },
      { status: statusCode }
    );
  }
}
