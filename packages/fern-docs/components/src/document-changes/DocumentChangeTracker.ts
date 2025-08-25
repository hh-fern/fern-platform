import { DebugLogger } from "./DebugLogger";
import {
  BaseState,
  Change,
  ChangeId,
  ChangeInput,
  ChangeTrackingConfig,
  CommitPlan,
  CurrentState,
  DocumentChangeSet,
  FileContent,
  FileCreateChange,
  FilePath,
  FileUpdateChange,
} from "./types";

/**
 * Generates a unique ID for changes
 */
function generateChangeId(): ChangeId {
  return `change_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

/**
 * Pure function implementation of DocumentChangeSet
 * Immutable operations that return new instances
 */
export class DocumentChangeSetImpl implements DocumentChangeSet {
  constructor(
    public readonly baseState: BaseState,
    public readonly changes: Change[] = []
  ) {}

  getCurrentState(): CurrentState {
    const currentFiles = new Map(this.baseState.files);
    const currentDocsYml = this.baseState.docsYml;

    // Apply all changes in chronological order
    for (const change of this.changes) {
      switch (change.type) {
        case "file:create":
        case "file:update":
          currentFiles.set(change.path, change.content);
          break;

        case "file:delete":
          currentFiles.delete(change.path);
          break;

        case "docs.yml:add-page":
          // Note: Actual docs.yml modification would require the utility functions
          // For now, we'll track the intent and apply it during commit planning
          break;

        case "docs.yml:remove-page":
          // Same as above - track intent for later application
          break;
      }
    }

    return {
      files: currentFiles,
      docsYml: currentDocsYml,
    };
  }

  getCommitPlan(): CommitPlan {
    const currentState = this.getCurrentState();
    const filesToCommit = new Map<FilePath, FileContent>();
    const filesToDelete: FilePath[] = [];

    // Find files that have been created or modified
    for (const [filePath, content] of Array.from(currentState.files)) {
      const baseContent = this.baseState.files.get(filePath);
      if (baseContent !== content) {
        filesToCommit.set(filePath, content);
      }
    }

    // Find files that have been deleted
    for (const filePath of Array.from(this.baseState.files.keys())) {
      if (!currentState.files.has(filePath)) {
        filesToDelete.push(filePath);
      }
    }

    // Check if docs.yml needs to be updated
    let docsYmlContent: string | undefined;
    const docsYmlChanges = this.changes.filter(
      (c) => c.type === "docs.yml:add-page" || c.type === "docs.yml:remove-page"
    );

    DebugLogger.debug(
      `[DocumentChangeSet] Found ${docsYmlChanges.length} docs.yml changes:`,
      docsYmlChanges.map((c) => `${c.type}:${(c as any).pagePath || "unknown"}`)
    );

    if (docsYmlChanges.length > 0) {
      // For now, mark that docs.yml needs updating
      // The actual content generation will be handled by the CommitOrchestrator
      docsYmlContent = currentState.docsYml;
      DebugLogger.debug(
        `[DocumentChangeSet] Setting docsYmlContent (length: ${docsYmlContent.length})`
      );
    } else {
      DebugLogger.debug(`[DocumentChangeSet] No docs.yml changes found`);
    }

    const hasChanges =
      filesToCommit.size > 0 ||
      filesToDelete.length > 0 ||
      docsYmlContent !== undefined;

    return {
      filesToCommit,
      filesToDelete,
      docsYmlContent,
      hasChanges,
    };
  }

  addChange(changeInput: ChangeInput): DocumentChangeSet {
    const change: Change = {
      ...changeInput,
      id: generateChangeId(),
      timestamp: Date.now(),
    } as Change;

    DebugLogger.debug(
      `[DocumentChangeSet] Adding change: ${change.type} ${(change as any).path || ""}`
    );

    // Create new instance with the added change
    const newChanges = [...this.changes, change];

    return new DocumentChangeSetImpl(this.baseState, newChanges);
  }

  removeChange(changeId: ChangeId): DocumentChangeSet {
    const newChanges = this.changes.filter((change) => change.id !== changeId);
    return new DocumentChangeSetImpl(this.baseState, newChanges);
  }

  hasChanges(): boolean {
    return this.changes.length > 0;
  }

  getChangesForFile(filePath: FilePath): Change[] {
    return this.changes.filter(
      (change) =>
        (change.type === "file:create" ||
          change.type === "file:update" ||
          change.type === "file:delete") &&
        change.path === filePath
    );
  }

  getFileContent(filePath: FilePath): FileContent | undefined {
    const currentState = this.getCurrentState();
    return currentState.files.get(filePath);
  }
}

/**
 * Main class for tracking document changes
 * Provides high-level operations and change optimization
 */
export class DocumentChangeTracker {
  private config: ChangeTrackingConfig;

  constructor(config: ChangeTrackingConfig = {}) {
    this.config = {
      maxChanges: 1000,
      autoCompact: true,
      ...config,
    };
  }

  /**
   * Creates a new empty change set
   */
  createChangeSet(baseState: BaseState): DocumentChangeSet {
    return new DocumentChangeSetImpl(baseState);
  }

  /**
   * Creates a change set from existing changes
   */
  createChangeSetFromChanges(
    baseState: BaseState,
    changes: Change[]
  ): DocumentChangeSet {
    let changeSet = new DocumentChangeSetImpl(baseState, []);

    // Add changes one by one to allow for compaction
    for (const change of changes) {
      changeSet = this.addChangeWithOptimization(changeSet, change);
    }

    return changeSet;
  }

  /**
   * Adds a change with automatic optimization if enabled
   */
  private addChangeWithOptimization(
    changeSet: DocumentChangeSet,
    change: ChangeInput
  ): DocumentChangeSet {
    let newChangeSet = changeSet.addChange(change);

    if (this.config.autoCompact) {
      newChangeSet = this.compactChanges(newChangeSet);
    }

    if (
      this.config.maxChanges &&
      newChangeSet.changes.length > this.config.maxChanges
    ) {
      // Keep only the most recent changes
      const recentChanges = newChangeSet.changes.slice(-this.config.maxChanges);
      newChangeSet = new DocumentChangeSetImpl(
        newChangeSet.baseState,
        recentChanges
      );
    }

    return newChangeSet;
  }

  /**
   * Optimizes change history by removing redundant operations
   * For example: create -> delete = no net change
   */
  compactChanges(changeSet: DocumentChangeSet): DocumentChangeSet {
    const originalChangeCount = changeSet.changes.length;
    DebugLogger.info(
      `[DocumentChangeTracker] Starting compaction with ${originalChangeCount} changes`
    );

    const compactedChanges: Change[] = [];
    const fileChangeMap = new Map<FilePath, Change[]>();
    const docsYmlChanges: Change[] = [];

    // Group changes by file path
    for (const change of changeSet.changes) {
      if (change.type.startsWith("file:")) {
        const path = (change as any).path as FilePath;
        if (!fileChangeMap.has(path)) {
          fileChangeMap.set(path, []);
        }
        const fileChanges = fileChangeMap.get(path);
        if (fileChanges) {
          fileChanges.push(change);
        }
      } else {
        docsYmlChanges.push(change);
      }
    }

    DebugLogger.debug(
      `[DocumentChangeTracker] Grouped changes: ${fileChangeMap.size} files, ${docsYmlChanges.length} docs.yml changes`
    );
    DebugLogger.debug(
      `[DocumentChangeTracker] Docs.yml changes:`,
      docsYmlChanges.map((c) => `${c.type}:${(c as any).pagePath || "unknown"}`)
    );

    // Track files that were created and then deleted (net zero effect)
    const cancelledFiles = new Set<FilePath>();

    // Compact changes for each file
    for (const [filePath, fileChanges] of Array.from(fileChangeMap)) {
      const compactedFileChanges = this.compactFileChanges(fileChanges);
      compactedChanges.push(...compactedFileChanges);

      // Check if this file was created and then deleted (no net change)
      if (compactedFileChanges.length === 0) {
        // File had changes that cancelled out completely
        const hasCreate = fileChanges.some((c) => c.type === "file:create");
        const hasDelete = fileChanges.some((c) => c.type === "file:delete");
        if (hasCreate && hasDelete) {
          cancelledFiles.add(filePath);
        }
      }
    }

    // Compact docs.yml changes, removing add/remove pairs for cancelled files
    DebugLogger.debug(
      `[DocumentChangeTracker] Cancelled files: ${Array.from(cancelledFiles)}`
    );
    const compactedDocsYmlChanges = this.compactDocsYmlChanges(
      docsYmlChanges,
      cancelledFiles
    );
    DebugLogger.debug(
      `[DocumentChangeTracker] After docs.yml compaction: ${compactedDocsYmlChanges.length} changes`
    );
    compactedChanges.push(...compactedDocsYmlChanges);

    // Sort by timestamp to maintain chronological order
    compactedChanges.sort((a, b) => a.timestamp - b.timestamp);

    const newChangeCount = compactedChanges.length;
    if (originalChangeCount !== newChangeCount) {
      DebugLogger.info(
        `[DocumentChangeTracker] Compacted ${originalChangeCount} changes to ${newChangeCount} changes`
      );
    }

    return new DocumentChangeSetImpl(changeSet.baseState, compactedChanges);
  }

  /**
   * Compacts changes for a single file
   */
  private compactFileChanges(changes: Change[]): Change[] {
    if (changes.length === 0) return [];

    // Sort by timestamp
    changes.sort((a, b) => a.timestamp - b.timestamp);

    const result: Change[] = [];
    const firstChange = changes[0];
    if (!firstChange) return result;

    let lastChange: Change | null = firstChange;

    for (let i = 1; i < changes.length; i++) {
      const currentChange = changes[i];
      if (!currentChange) continue;

      if (!lastChange) {
        lastChange = currentChange;
        continue;
      }

      // If we have create followed by delete, they cancel out
      if (
        lastChange.type === "file:create" &&
        currentChange.type === "file:delete"
      ) {
        lastChange = null; // No net change
        continue;
      }

      // If we have multiple updates, keep only the last one
      if (
        lastChange.type === "file:update" &&
        currentChange.type === "file:update"
      ) {
        lastChange = currentChange;
        continue;
      }

      // If we have create followed by update, collapse to single create
      if (
        lastChange.type === "file:create" &&
        currentChange.type === "file:update"
      ) {
        lastChange = {
          ...lastChange,
          content: (currentChange as FileUpdateChange).content,
          timestamp: currentChange.timestamp,
        } as FileCreateChange;
        continue;
      }

      // Otherwise, keep the last change and move to current
      result.push(lastChange);
      lastChange = currentChange;
    }

    // Don't forget the last change
    if (lastChange) {
      result.push(lastChange);
    }

    return result;
  }

  /**
   * Compacts docs.yml changes, removing add/remove pairs for cancelled files
   */
  private compactDocsYmlChanges(
    docsYmlChanges: Change[],
    cancelledFiles: Set<FilePath>
  ): Change[] {
    const result: Change[] = [];
    const addChangeMap = new Map<FilePath, Change>();
    const removeChangeMap = new Map<FilePath, Change>();

    // Sort changes by timestamp first
    const sortedChanges = [...docsYmlChanges].sort(
      (a, b) => a.timestamp - b.timestamp
    );

    // Separate add and remove changes
    for (const change of sortedChanges) {
      if (change.type === "docs.yml:add-page") {
        const addChange = change as any;
        addChangeMap.set(addChange.pagePath, change);
      } else if (change.type === "docs.yml:remove-page") {
        const removeChange = change as any;
        removeChangeMap.set(removeChange.pagePath, change);
      }
    }

    // For each cancelled file, remove both add and remove operations
    for (const cancelledFile of cancelledFiles) {
      addChangeMap.delete(cancelledFile);
      removeChangeMap.delete(cancelledFile);
    }

    // For remaining files, check for add+remove pairs and cancel them out
    for (const [filePath, addChange] of addChangeMap) {
      if (removeChangeMap.has(filePath)) {
        // This file has both add and remove - they cancel out
        removeChangeMap.delete(filePath);
        // Don't add either change to result
        DebugLogger.debug(
          `[DocumentChangeTracker] Cancelled docs.yml add+remove for ${filePath}`
        );
      } else {
        // Only add change remains
        result.push(addChange);
      }
    }

    // Add remaining remove changes (those without corresponding add)
    for (const removeChange of removeChangeMap.values()) {
      result.push(removeChange);
    }

    return result;
  }

  /**
   * Validates that a change set is consistent
   */
  validateChangeSet(changeSet: DocumentChangeSet): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check for duplicate change IDs
    const changeIds = new Set<ChangeId>();
    for (const change of changeSet.changes) {
      if (changeIds.has(change.id)) {
        errors.push(`Duplicate change ID: ${change.id}`);
      }
      changeIds.add(change.id);
    }

    // Check for chronological order
    for (let i = 1; i < changeSet.changes.length; i++) {
      const currentChange = changeSet.changes[i];
      const previousChange = changeSet.changes[i - 1];
      if (
        currentChange &&
        previousChange &&
        currentChange.timestamp < previousChange.timestamp
      ) {
        errors.push(`Changes not in chronological order at index ${i}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
