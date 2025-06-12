import { Octokit } from "@octokit/core";

import * as auth0Management from "@/app/services/auth0/management";
import { Auth0UserID } from "@/app/services/auth0/types";
import { GithubRepo } from "@/app/services/github/types";

export default async function getUserGithubRepos(userId: Auth0UserID) {
  const githubToken = await auth0Management.getUserGithubToken(userId);
  const octokit = new Octokit({ auth: githubToken });

  const response = await octokit.request("GET /user/repos", {});

  const repos = response.data.map((repo) => ({
    name: repo.name,
    url: repo.html_url,
    owner: repo.owner.login,
    full_name: repo.full_name,
  }));

  return repos as GithubRepo[];
}
