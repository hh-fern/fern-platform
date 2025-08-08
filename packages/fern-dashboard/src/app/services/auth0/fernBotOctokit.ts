import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/core";

/**
 * TODO
 * Gets Octokit for a specific repo where fern-bot is installed. This should then
 * deprecate the use of the `octokit.ts` file.
 *
 * @param owner - The owner of the repository
 * @param repo - The name of the repository
 * @returns The Octokit instance for the fern-bot installation
 */
export async function getFernBotOctokitForRepo(owner: string, repo: string) {
  const appOctokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.FERN_BOT_APP_ID,
      privateKey: process.env.FERN_BOT_PRIVATE_KEY,
    },
  });
  // Get installation ID for the repo
  const { data: installation } = await appOctokit.request(
    "GET /repos/{owner}/{repo}/installation",
    {
      owner,
      repo,
    }
  );

  // Create installation-specific Octokit
  const fernBotOctokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.FERN_BOT_APP_ID,
      privateKey: process.env.FERN_BOT_PRIVATE_KEY,
      installationId: installation.id,
    },
  });

  return fernBotOctokit;
}
