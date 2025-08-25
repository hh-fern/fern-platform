import { DebugLogger } from "./DebugLogger";
import {
  CommitPlan,
  CommitResult,
  DocsYmlAddPageChange,
  DocsYmlRemovePageChange,
  DocumentChangeSet,
  FilePath,
} from "./types";

/**
 * GitHub API interface for committing changes
 */
export interface GitHubApi {
  createCommit(request: GitHubCommitRequest): Promise<GitHubCommitResponse>;
}

/**
 * File content loader interface for fetching current repository content
 */
export interface FileContentLoader {
  getFileContent(
    owner: string,
    repo: string,
    ref: string,
    path: string
  ): Promise<string | null>;
}

export interface GitHubCommitRequest {
  owner: string;
  repo: string;
  branch: string;
  message: string;
  files: GitHubFile[];
}

export interface GitHubFile {
  path: string;
  content?: string;
  mode?: "100644" | "100755" | "040000" | "160000" | "120000";
  delete?: boolean;
}

export interface GitHubCommitResponse {
  success: boolean;
  commitSha?: string;
  error?: string;
}

/**
 * Docs.yml update utilities interface
 * Abstracts the yaml manipulation logic
 */
export interface DocsYmlUpdater {
  addPageToDocsYml(
    content: string,
    sectionTitle: string,
    pageEntry: { path: string; page: string }
  ): string;
  removePageFromDocsYml(content: string, pagePath: string): string;
  parseYaml(content: string): any;
}

/**
 * Configuration for commit operations
 */
export interface CommitConfig {
  owner: string;
  repo: string;
  branch: string;
  message?: string;
  pathPrefix?: string; // e.g., 'fern/' for prefixing all file paths
}

/**
 * Orchestrates the commit process by converting change sets to GitHub commits
 * Replaces the complex collectAllChanges function with clean, testable logic
 */
export class CommitOrchestrator {
  private githubApi: GitHubApi;
  private docsYmlUpdater: DocsYmlUpdater;
  private fileContentLoader?: FileContentLoader;
  private defaultCommitMessage: string;

  constructor(
    githubApi: GitHubApi,
    docsYmlUpdater: DocsYmlUpdater,
    defaultCommitMessage = "Update documentation files",
    fileContentLoader?: FileContentLoader
  ) {
    this.githubApi = githubApi;
    this.docsYmlUpdater = docsYmlUpdater;
    this.fileContentLoader = fileContentLoader;
    this.defaultCommitMessage = defaultCommitMessage;
  }

  /**
   * Commits all changes in a change set to GitHub
   */
  async commit(
    changeSet: DocumentChangeSet,
    config: CommitConfig
  ): Promise<CommitResult> {
    try {
      const commitPlan = this.generateCommitPlan(changeSet);

      DebugLogger.info(
        `[CommitOrchestrator] Planning commit for ${changeSet.changes.length} changes`
      );

      // Debug all changes in the changeSet
      DebugLogger.debug(
        `[CommitOrchestrator] All changes:`,
        changeSet.changes.map(
          (c) =>
            `${c.type}:${(c as any).path || (c as any).pagePath || "unknown"}`
        )
      );

      // Debug baseState
      DebugLogger.debug(
        `[CommitOrchestrator] BaseState docsYml length: ${changeSet.baseState.docsYml.length}`
      );

      // Debug the commit plan details
      DebugLogger.debug(`[CommitOrchestrator] Commit plan details:`, {
        filesToCommit: commitPlan.filesToCommit.size,
        filesToDelete: commitPlan.filesToDelete.length,
        hasDocsYml: commitPlan.docsYmlContent !== undefined,
        docsYmlContentLength: commitPlan.docsYmlContent?.length || 0,
        hasChanges: commitPlan.hasChanges,
      });

      if (!commitPlan.hasChanges) {
        DebugLogger.warn(`[CommitOrchestrator] No changes to commit`);
        return {
          success: false,
          error: "No changes to commit",
        };
      }

      const stats = this.getCommitStats(changeSet);
      DebugLogger.info(
        `[CommitOrchestrator] Commit stats: ${stats.filesCreated} created, ${stats.filesUpdated} updated, ${stats.filesDeleted} deleted, ${stats.docsYmlChanges} docs.yml changes`
      );

      const gitFiles = await this.buildGitHubFiles(
        commitPlan,
        changeSet,
        config
      );

      DebugLogger.info(
        `[CommitOrchestrator] Committing ${gitFiles.length} files to ${config.owner}/${config.repo}#${config.branch}`
      );

      const response = await this.githubApi.createCommit({
        owner: config.owner,
        repo: config.repo,
        branch: config.branch,
        message: config.message || this.defaultCommitMessage,
        files: gitFiles,
      });

      if (response.success) {
        DebugLogger.info(
          `[CommitOrchestrator] Commit successful: ${response.commitSha}`
        );
      } else {
        DebugLogger.error(
          `[CommitOrchestrator] Commit failed: ${response.error}`
        );
      }

      return response;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      DebugLogger.error(`[CommitOrchestrator] Commit error: ${errorMessage}`);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Generates a commit plan from a change set
   * Pure function that can be easily tested
   */
  generateCommitPlan(changeSet: DocumentChangeSet): CommitPlan {
    return changeSet.getCommitPlan();
  }

  /**
   * Builds the GitHub files array from a commit plan
   */
  private async buildGitHubFiles(
    commitPlan: CommitPlan,
    changeSet: DocumentChangeSet,
    config: CommitConfig
  ): Promise<GitHubFile[]> {
    const gitFiles: GitHubFile[] = [];
    const pathPrefix = config.pathPrefix || "";

    // Add files to commit/update
    for (const [filePath, content] of commitPlan.filesToCommit) {
      gitFiles.push({
        path: `${pathPrefix}${filePath}`,
        content,
        mode: "100644",
      });
    }

    // Add files to delete
    for (const filePath of commitPlan.filesToDelete) {
      gitFiles.push({
        path: `${pathPrefix}${filePath}`,
        delete: true,
      });
    }

    // Handle docs.yml updates
    if (commitPlan.docsYmlContent !== undefined) {
      DebugLogger.info(
        `[CommitOrchestrator] Building updated docs.yml content`
      );
      const updatedDocsYml = await this.buildUpdatedDocsYml(changeSet, config);
      gitFiles.push({
        path: `${pathPrefix}docs.yml`,
        content: updatedDocsYml,
        mode: "100644",
      });
      DebugLogger.debug(
        `[CommitOrchestrator] Added docs.yml to commit (${updatedDocsYml.length} chars)`
      );
    }

    return gitFiles;
  }

  /**
   * Builds the updated docs.yml content by applying all docs.yml changes
   */
  private async buildUpdatedDocsYml(
    changeSet: DocumentChangeSet,
    config: CommitConfig
  ): Promise<string> {
    let currentContent = changeSet.baseState.docsYml;

    DebugLogger.debug(
      `[CommitOrchestrator] Starting with baseState docsYml content: "${currentContent}" (length: ${currentContent.length})`
    );

    // Get all docs.yml-related changes in chronological order
    const docsYmlChanges = changeSet.changes
      .filter(
        (change) =>
          change.type === "docs.yml:add-page" ||
          change.type === "docs.yml:remove-page"
      )
      .sort((a, b) => a.timestamp - b.timestamp);

    DebugLogger.info(
      `[CommitOrchestrator] Processing ${docsYmlChanges.length} docs.yml changes`
    );

    // If we have docs.yml changes but our baseState content is empty/minimal,
    // we need to fetch the actual current docs.yml content from the repository
    if (
      docsYmlChanges.length > 0 &&
      currentContent.trim().length === 0 &&
      this.fileContentLoader
    ) {
      DebugLogger.info(
        `[CommitOrchestrator] BaseState has empty docs.yml but we have ${docsYmlChanges.length} docs.yml changes - fetching current repository content`
      );

      try {
        const actualDocsYmlContent =
          await this.fileContentLoader.getFileContent(
            config.owner,
            config.repo,
            config.branch,
            `${config.pathPrefix || ""}docs.yml`
          );

        if (actualDocsYmlContent != null) {
          currentContent = actualDocsYmlContent;
          DebugLogger.info(
            `[CommitOrchestrator] Successfully fetched current docs.yml content (${currentContent.length} chars)`
          );
        } else {
          DebugLogger.warn(
            `[CommitOrchestrator] No docs.yml found in repository - will create new one`
          );
        }
      } catch (error) {
        DebugLogger.error(
          `[CommitOrchestrator] Failed to fetch current docs.yml content:`,
          error
        );
        // Continue with empty content - will create a new structure
      }
    } else if (
      docsYmlChanges.length > 0 &&
      currentContent.trim().length === 0
    ) {
      DebugLogger.warn(
        `[CommitOrchestrator] No fileContentLoader provided - cannot fetch current docs.yml content, will create new structure`
      );
    }

    // Apply each change in order
    for (const change of docsYmlChanges) {
      try {
        if (change.type === "docs.yml:add-page") {
          const addChange = change as DocsYmlAddPageChange;
          DebugLogger.debug(
            `[CommitOrchestrator] Adding page ${addChange.pagePath} to section ${addChange.section}`
          );

          currentContent = this.docsYmlUpdater.addPageToDocsYml(
            currentContent,
            addChange.section,
            {
              path: addChange.pagePath,
              page: this.extractPageName(addChange.pagePath),
            }
          );
        } else if (change.type === "docs.yml:remove-page") {
          const removeChange = change as DocsYmlRemovePageChange;
          DebugLogger.debug(
            `[CommitOrchestrator] Removing page ${removeChange.pagePath}`
          );

          currentContent = this.docsYmlUpdater.removePageFromDocsYml(
            currentContent,
            removeChange.pagePath
          );
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        DebugLogger.error(
          `[CommitOrchestrator] Failed to apply docs.yml change (${change.type}): ${errorMessage}`
        );
        // Continue with other changes rather than failing the entire commit
      }
    }

    return currentContent;
  }

  /**
   * Extracts the page name from a file path
   * e.g., 'getting-started/quickstart.mdx' -> 'quickstart.mdx'
   */
  private extractPageName(filePath: FilePath): string {
    return filePath.split("/").pop() || filePath;
  }

  /**
   * Validates that a commit is ready to be executed
   */
  validateCommit(
    changeSet: DocumentChangeSet,
    config: CommitConfig
  ): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check required config
    if (!config.owner?.trim()) {
      errors.push("Owner is required");
    }
    if (!config.repo?.trim()) {
      errors.push("Repository is required");
    }
    if (!config.branch?.trim()) {
      errors.push("Branch is required");
    }

    // Check if there are changes to commit
    const commitPlan = changeSet.getCommitPlan();
    if (!commitPlan.hasChanges) {
      errors.push("No changes to commit");
    }

    // Validate file paths
    for (const filePath of commitPlan.filesToCommit.keys()) {
      if (!filePath?.trim()) {
        errors.push("Empty file path detected");
      }
      if (filePath.includes("..")) {
        errors.push(`Invalid file path: ${filePath}`);
      }
    }

    for (const filePath of commitPlan.filesToDelete) {
      if (!filePath?.trim()) {
        errors.push("Empty delete path detected");
      }
      if (filePath.includes("..")) {
        errors.push(`Invalid delete path: ${filePath}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Preview what would be committed without actually committing
   */
  async previewCommit(
    changeSet: DocumentChangeSet,
    config: CommitConfig
  ): Promise<{
    files: {
      path: string;
      action: "create" | "update" | "delete";
      content?: string;
      size?: number;
    }[];
    totalFiles: number;
    hasDocsYmlChanges: boolean;
  }> {
    const commitPlan = this.generateCommitPlan(changeSet);
    const files: {
      path: string;
      action: "create" | "update" | "delete";
      content?: string;
      size?: number;
    }[] = [];

    const pathPrefix = config.pathPrefix || "";

    // Process files to commit
    for (const [filePath, content] of commitPlan.filesToCommit) {
      const isNew = !changeSet.baseState.files.has(filePath);
      files.push({
        path: `${pathPrefix}${filePath}`,
        action: isNew ? "create" : "update",
        content,
        size: content.length,
      });
    }

    // Process files to delete
    for (const filePath of commitPlan.filesToDelete) {
      files.push({
        path: `${pathPrefix}${filePath}`,
        action: "delete",
      });
    }

    // Add docs.yml if it will be updated
    let hasDocsYmlChanges = false;
    if (commitPlan.docsYmlContent !== undefined) {
      hasDocsYmlChanges = true;
      const updatedDocsYml = await this.buildUpdatedDocsYml(changeSet, config);
      files.push({
        path: `${pathPrefix}docs.yml`,
        action: "update",
        content: updatedDocsYml,
        size: updatedDocsYml.length,
      });
    }

    return {
      files,
      totalFiles: files.length,
      hasDocsYmlChanges,
    };
  }

  /**
   * Calculates commit statistics
   */
  getCommitStats(changeSet: DocumentChangeSet): {
    totalChanges: number;
    filesCreated: number;
    filesUpdated: number;
    filesDeleted: number;
    docsYmlChanges: number;
  } {
    const stats = {
      totalChanges: changeSet.changes.length,
      filesCreated: 0,
      filesUpdated: 0,
      filesDeleted: 0,
      docsYmlChanges: 0,
    };

    for (const change of changeSet.changes) {
      switch (change.type) {
        case "file:create":
          stats.filesCreated++;
          break;
        case "file:update":
          stats.filesUpdated++;
          break;
        case "file:delete":
          stats.filesDeleted++;
          break;
        case "docs.yml:add-page":
        case "docs.yml:remove-page":
          stats.docsYmlChanges++;
          break;
      }
    }

    return stats;
  }
}
