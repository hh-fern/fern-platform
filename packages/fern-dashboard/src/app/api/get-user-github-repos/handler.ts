import { Octokit } from "@octokit/core";

import * as auth0Management from "@/app/services/auth0/management";
import { Auth0UserID } from "@/app/services/auth0/types";

export default async function getUserGithubRepos(userId: Auth0UserID) {
  const githubToken = await auth0Management.getUserGithubToken(userId);
  const octokit = new Octokit({ auth: githubToken });

  const response = await octokit.request("GET /user/repos", {});

  const repos = response.data.map((repo) => ({
    name: repo.name,
    url: repo.html_url,
  }));

  return repos;
}
