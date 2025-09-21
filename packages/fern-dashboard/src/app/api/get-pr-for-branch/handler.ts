import { cacheLife } from "next/dist/server/use-cache/cache-life";

import { getFernBotOctokitForRepo } from "@/app/services/auth0/fernBotOctokit";
import { getCurrentSession } from "@/app/services/auth0/getCurrentSession";

type GetPrForBranchRequest = {
  owner: string;
  repo: string;
  branch: string;
  baseBranch?: string;
};

type GetPrForBranchResponse = {
  success: boolean;
  error?: string;
  title?: string;
  prNumber?: number;
  prUrl?: string;
  status?: string;
  draft?: boolean;
  merged?: boolean;
  nodeId?: string;
};

export default async function getPrForBranch(
  request: GetPrForBranchRequest
): Promise<GetPrForBranchResponse> {
  // assert that the session is valid
  const session = await getCurrentSession();
  if (session == null) {
    return { success: false, error: "No session found" };
  }

  return await getPrForBranchCached(request);
}

/**
 * @internal
 * this function leverages caching to avoid making the same request multiple times
 * but doesn't check for session validity
 */
async function getPrForBranchCached(
  request: GetPrForBranchRequest
): Promise<GetPrForBranchResponse> {
  "use cache";

  // revalidate every minute because the status of the PR can change at any time
  cacheLife("minutes");

  const octokitResult = await getFernBotOctokitForRepo(
    request.owner,
    request.repo
  );

  if (!octokitResult.ok) {
    throw new Error(`Failed to get GitHub client: ${octokitResult.error.type}`);
  }

  const octokit = octokitResult.octokit;

  try {
    // Find associated PRs for the branch
    const response = await octokit.request("GET /repos/{owner}/{repo}/pulls", {
      owner: request.owner,
      repo: request.repo,
      head: `${request.owner}:${request.branch}`,
      base: request.baseBranch,
      state: "all", // we fetch all so that we are able to display the status if its not open
    });

    if (response.data.length === 0) {
      return {
        success: false,
        error: "No associated PRs found for this branch",
      };
    }

    const octokitResult = await getFernBotOctokitForRepo(request.owner, request.repo);

    if (!octokitResult.ok) {
        throw new Error(`Failed to get GitHub client: ${octokitResult.error.type}`);
    }

    const octokit = octokitResult.octokit;

    try {
        // Find associated PRs for the branch
        const response = await octokit.request("GET /repos/{owner}/{repo}/pulls", {
            owner: request.owner,
            repo: request.repo,
            head: `${request.owner}:${request.branch}`,
            base: request.baseBranch,
            state: "all" // we fetch all so that we are able to display the status if its not open
        });

        if (response.data.length === 0) {
            return {
                success: false,
                error: "No associated PRs found for this branch"
            };
        }

        const openPrs = response.data.filter((pr) => pr.state === "open");

        if (openPrs.length > 1) {
            return {
                success: false,
                error: "Multiple open PRs found for this branch"
            };
        }

        // Use the open PR if it exists, otherwise use the first PR returned.
        // The UI will handle the case where the PR is closed/merged, but we should error (above)
        // if there are multiple open PRs.
        const pr = openPrs[0] || response.data[0];
        return {
            success: true,
            title: pr?.title,
            prNumber: pr?.number,
            prUrl: pr?.html_url,
            status: pr?.state,
            draft: pr?.draft,
            merged: pr?.merged_at != null,
            nodeId: pr?.node_id
        };
    } catch (error) {
        console.error("Failed to fetch PR for branch", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred"
        };
    }
}
