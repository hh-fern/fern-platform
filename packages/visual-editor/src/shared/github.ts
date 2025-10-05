export const DEFAULT_PR_TITLE = "Visual Editor: Update";
export const DEFAULT_COMMIT_MESSAGE = "Visual Editor: Update";

export type GITHUB_FILE_MODE = "100644" | "100755" | "040000" | "160000" | "120000";
export type GithubCommitableFile =
    | {
          path: string;
          delete: true;
          mode?: GITHUB_FILE_MODE;
      }
    | {
          path: string;
          content: string;
          mode?: GITHUB_FILE_MODE;
          delete?: false;
      };

export type GithubRepo = {
    name: string;
    owner: string;
    url: string;
    avatarUrl: string;
    description: string;
    stargazersCount: number;
    organization: string | undefined;
};

export type GithubSourceRepo = {
    githubUrl: string | undefined;
    repoName: string | undefined;
    owner: string | undefined;
    repo: string | undefined;
    baseBranch: string | undefined;
    fernBotHasInstallationId: boolean | undefined;
};

export type GithubPrStatus = "open" | "closed" | "merged" | "draft";

export function getOwnerAndRepoFromGithubUrl(githubUrl: string) {
    const piecesAfterGithubCom = githubUrl.split("github.com/")[1];
    if (piecesAfterGithubCom == null) {
        return { owner: null, repo: null };
    }
    const [owner, repo] = piecesAfterGithubCom.split("/").slice(0, 2);
    return { owner, repo };
}

export function getRepoDisplayNameFromUrl(githubUrl: string) {
    const { owner, repo } = getOwnerAndRepoFromGithubUrl(githubUrl);
    if (owner == null || repo == null) {
        return githubUrl;
    }
    return `${owner}/${repo}`;
}

export function validateUrlIsGithubUrl(inputUrl: string): boolean {
    if (inputUrl === "") {
        return false;
    }
    // Check if URL starts with http/https
    if (!inputUrl.startsWith("https://") && !inputUrl.startsWith("http://")) {
        return false;
    }

    try {
        const url = new URL(inputUrl);
        // Check if domain is github.com
        if (url.hostname !== "github.com") {
            return false;
        }

        // Check if path has at least 2 segments (username/repo)
        const pathSegments = url.pathname.split("/").filter((segment) => segment.length > 0);
        if (pathSegments.length < 2) {
            return false;
        }

        return true;
    } catch {
        // If URL parsing fails, it's not a valid GitHub URL
        return false;
    }
}
