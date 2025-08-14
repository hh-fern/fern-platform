import { Octokit } from "@octokit/core";

import { GitLoader } from "@fern-api/docs-loader";

import { getOctokit } from "../auth0/octokit";
import { Auth0OrgName, Auth0UserID } from "../auth0/types";

/**
 * The GitHubLoader is used to get files from a remote GitHub repository.
 */
export class GitHubLoader implements GitLoader {
  private getOctokitInstance: () => Promise<Octokit | null>;
  private octokit: Octokit | null = null;

  constructor(userId: Auth0UserID, orgName?: Auth0OrgName) {
    this.getOctokitInstance = () => getOctokit(userId, orgName);
  }

  async getOctokit() {
    if (this.octokit == null) {
      this.octokit = await this.getOctokitInstance();
    }
    return this.octokit;
  }

  async getDocsYml(
    owner: string,
    repo: string,
    ref: string = "main"
  ): Promise<string | null> {
    return this.getFile(owner, repo, "fern/docs.yml", ref);
  }

  async getFile(
    owner: string,
    repo: string,
    path: string,
    ref: string = "main"
  ): Promise<string | null> {
    try {
      const octokit = await this.getOctokit();
      if (!octokit) {
        console.error("Failed to get Octokit instance");
        return null;
      }

      const response = await octokit.request(
        "GET /repos/{owner}/{repo}/contents/{path}",
        {
          owner,
          repo,
          path,
          ref,
        }
      );

      if ("content" in response.data) {
        const content = Buffer.from(response.data.content, "base64").toString(
          "utf8"
        );
        return content;
      }

      return null;
    } catch (error) {
      console.error(
        `Failed to fetch file ${path} from ${owner}/${repo}:`,
        error
      );
      return null;
    }
  }
}
