/**
 * Core types for the new document change tracking system
 */

export type FilePath = string;
export type FileContent = string;
export type DocsYmlContent = string;
export type ChangeId = string;
export type SectionTitle = string;

/**
 * Represents different types of changes that can be made to documents
 */
export type Change =
  | FileCreateChange
  | FileUpdateChange
  | FileDeleteChange
  | DocsYmlAddPageChange
  | DocsYmlRemovePageChange;

export interface BaseChange {
  id: ChangeId;
  timestamp: number;
  type: string;
}

export interface FileCreateChange extends BaseChange {
  type: "file:create";
  path: FilePath;
  content: FileContent;
  section?: SectionTitle;
}

export interface FileUpdateChange extends BaseChange {
  type: "file:update";
  path: FilePath;
  content: FileContent;
}

export interface FileDeleteChange extends BaseChange {
  type: "file:delete";
  path: FilePath;
}

export interface DocsYmlAddPageChange extends BaseChange {
  type: "docs.yml:add-page";
  pagePath: FilePath;
  section: SectionTitle;
}

export interface DocsYmlRemovePageChange extends BaseChange {
  type: "docs.yml:remove-page";
  pagePath: FilePath;
}

/**
 * Represents the base state (what's currently in Git)
 */
export interface BaseState {
  files: Map<FilePath, FileContent>;
  docsYml: DocsYmlContent;
}

/**
 * Represents the current computed state after applying all changes
 */
export interface CurrentState {
  files: Map<FilePath, FileContent>;
  docsYml: DocsYmlContent;
}

/**
 * Represents what needs to be committed to Git
 */
export interface CommitPlan {
  filesToCommit: Map<FilePath, FileContent>;
  filesToDelete: FilePath[];
  docsYmlContent?: DocsYmlContent;
  hasChanges: boolean;
}

/**
 * The main container for all document changes
 */
export interface DocumentChangeSet {
  baseState: BaseState;
  changes: Change[];

  // Core computed methods
  getCurrentState(): CurrentState;
  getCommitPlan(): CommitPlan;

  // Change management
  addChange(change: ChangeInput): DocumentChangeSet;
  removeChange(changeId: ChangeId): DocumentChangeSet;

  // Query methods
  hasChanges(): boolean;
  getChangesForFile(filePath: FilePath): Change[];
  getFileContent(filePath: FilePath): FileContent | undefined;
}

/**
 * Result of a commit operation
 */
export interface CommitResult {
  success: boolean;
  commitSha?: string;
  error?: string;
}

/**
 * Type for change input without id and timestamp
 */
export type ChangeInput =
  | Omit<FileCreateChange, "id" | "timestamp">
  | Omit<FileUpdateChange, "id" | "timestamp">
  | Omit<FileDeleteChange, "id" | "timestamp">
  | Omit<DocsYmlAddPageChange, "id" | "timestamp">
  | Omit<DocsYmlRemovePageChange, "id" | "timestamp">;

/**
 * Configuration for change tracking behavior
 */
export interface ChangeTrackingConfig {
  // Maximum number of changes to keep in memory
  maxChanges?: number;
  // Whether to automatically compact redundant changes
  autoCompact?: boolean;
}
