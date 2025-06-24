export interface GithubRepo {
  name: string;
  url: string;
}

export type GITHUB_FILE_MODE =
  | "100644"
  | "100755"
  | "040000"
  | "160000"
  | "120000";
export interface GithubCommitableFile {
  path: string;
  content: string;
  mode?: GITHUB_FILE_MODE;
}
