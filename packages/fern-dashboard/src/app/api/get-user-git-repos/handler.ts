import { Octokit } from "@octokit/core";

import { getCurrentSession } from "@/app/services/auth0/getCurrentSession";
import { Auth0UserID } from "@/app/services/auth0/types";
import { GithubRepo } from "@/app/services/github/types";

export default async function getUserGithubRepos(_userId: Auth0UserID) {
  const session = await getCurrentSession();

  const githubToken = session?.accessToken;

  const octokit = new Octokit({ auth: githubToken });

  const response = await octokit.request("GET /user/repos", {});

  const repos = response.data.map((repo) => ({
    name: repo.name,
    url: repo.html_url,
  }));

  return repos as GithubRepo[];
}
