import { Octokit } from "@octokit/core";

import * as auth0Management from "@/app/services/auth0/management";
import { Auth0UserID } from "@/app/services/auth0/types";

export default async function createGithubBranch(
  userId: Auth0UserID,
  owner: string,
  repo: string,
  baseBranch: string,
  newBranch: string
) {
  const githubToken = await auth0Management.getUserGithubToken(userId);
  const octokit = new Octokit({ auth: githubToken });

  try {
    const { data: baseRef } = await octokit.request(
      "GET /repos/{owner}/{repo}/git/ref/{ref}",
      {
        owner,
        repo,
        ref: `heads/${baseBranch}`,
      }
    );

    const baseSha = baseRef.object.sha;
    console.log(`Base SHA for ${owner}/${repo}@${baseBranch}: ${baseSha}`);

    await octokit.request("POST /repos/{owner}/{repo}/git/refs", {
      owner,
      repo,
      ref: `refs/heads/${newBranch}`,
      sha: baseSha,
    });

    console.log(`✅ Branch '${newBranch}' created successfully.`);
  } catch (err: any) {
    console.error("❌ Failed to create branch");
    if (err.status) {
      console.error(`HTTP ${err.status}: ${err.message}`);
    }
    if (err.response?.data) {
      console.error("Response:", JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err);
    }
    throw err;
  }
}
