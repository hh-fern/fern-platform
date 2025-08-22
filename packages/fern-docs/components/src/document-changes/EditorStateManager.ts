"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { DocumentChangeTracker } from "./DocumentChangeTracker";
import { ChangeStorage } from "./storage";
import {
  BaseState,
  Change,
  CommitPlan,
  DocumentChangeSet,
  FileContent,
  FilePath,
  SectionTitle,
} from "./types";

/**
 * Configuration for the editor state manager
 */
export interface EditorStateConfig {
  branchId: string;
  autoSave: boolean;
  autoSaveDelayMs: number;
  onError?: (error: Error) => void;
  onStateChange?: (changeSet: DocumentChangeSet) => void;
}

/**
 * React integration layer for document change tracking
 * Provides hooks and state management for the editor
 */
export class EditorStateManager {
  private changeTracker: DocumentChangeTracker;
  private storage: ChangeStorage;
  private autoSaveTimeout: NodeJS.Timeout | null = null;

  constructor(changeTracker: DocumentChangeTracker, storage: ChangeStorage) {
    this.changeTracker = changeTracker;
    this.storage = storage;
  }

  /**
   * Initialize the state manager with base state
   */
  async initialize(
    baseState: BaseState,
    branchId: string
  ): Promise<DocumentChangeSet> {
    // Try to load existing changes from storage
    const existingChangeSet = await this.storage.load(branchId);

    if (existingChangeSet) {
      // Update base state if it has changed
      if (this.hasBaseStateChanged(existingChangeSet.baseState, baseState)) {
        // In a real implementation, we might want to handle base state conflicts
        // For now, we'll create a new change set with updated base state
        return this.changeTracker.createChangeSetFromChanges(
          baseState,
          existingChangeSet.changes
        );
      }
      return existingChangeSet;
    }

    // Create new change set
    return this.changeTracker.createChangeSet(baseState);
  }

  /**
   * Check if base state has changed (e.g., due to server updates)
   */
  private hasBaseStateChanged(
    storedBase: BaseState,
    currentBase: BaseState
  ): boolean {
    if (storedBase.docsYml !== currentBase.docsYml) {
      return true;
    }

    if (storedBase.files.size !== currentBase.files.size) {
      return true;
    }

    for (const [path, content] of Array.from(storedBase.files)) {
      if (currentBase.files.get(path) !== content) {
        return true;
      }
    }

    return false;
  }

  /**
   * Save change set to storage with optional auto-save debouncing
   */
  async saveChangeSet(
    branchId: string,
    changeSet: DocumentChangeSet,
    { immediate = false, delayMs = 300 } = {}
  ): Promise<void> {
    if (immediate) {
      // Clear any pending auto-save
      if (this.autoSaveTimeout) {
        clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = null;
      }

      await this.storage.save(branchId, changeSet);
      return;
    }

    // Debounced save
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }

    this.autoSaveTimeout = setTimeout(() => {
      try {
        void this.storage.save(branchId, changeSet);
      } catch (error) {
        console.error("Failed to auto-save change set:", error);
      }
      this.autoSaveTimeout = null;
    }, delayMs);
  }
}

/**
 * React hook for managing document changes
 */
export function useDocumentChanges(
  baseState: BaseState,
  config: EditorStateConfig
): {
  changeSet: DocumentChangeSet | null;
  isLoading: boolean;

  // File operations
  createFile: (
    path: FilePath,
    content: FileContent,
    section?: SectionTitle
  ) => void;
  updateFile: (path: FilePath, content: FileContent) => void;
  deleteFile: (path: FilePath) => void;

  // Docs.yml operations
  addPageToDocsYml: (pagePath: FilePath, section: SectionTitle) => void;
  removePageFromDocsYml: (pagePath: FilePath) => void;

  // Query methods
  getFileContent: (path: FilePath) => FileContent | undefined;
  hasChanges: () => boolean;
  getCommitPlan: () => CommitPlan;

  // State management
  clearAllChanges: () => void;
  undoLastChange: () => void;

  error: Error | null;
} {
  const [changeSet, setChangeSet] = useState<DocumentChangeSet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const changeTracker = useMemo(() => new DocumentChangeTracker(), []);

  // Destructure config to stable individual values
  const { branchId, autoSave, autoSaveDelayMs, onError, onStateChange } =
    config;

  // Initialize change set on mount or when base state changes
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // For this example, we'll use a simple initialization
        // In practice, this would integrate with the storage system
        const initialChangeSet = changeTracker.createChangeSet(baseState);

        if (mounted) {
          setChangeSet(initialChangeSet);
          onStateChange?.(initialChangeSet);
        }
      } catch (err) {
        if (mounted) {
          const error =
            err instanceof Error ? err : new Error("Failed to initialize");
          setError(error);
          onError?.(error);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // TODO: This is a hack to get the type checker to work
    void initialize();

    return () => {
      mounted = false;
    };
  }, [changeTracker, baseState, branchId, onError, onStateChange]);

  // Auto-save effect
  useEffect(() => {
    if (!changeSet || !autoSave) return;

    const timeoutId = setTimeout(() => {
      // Here you would integrate with the storage system
      onStateChange?.(changeSet);
    }, autoSaveDelayMs);

    return () => clearTimeout(timeoutId);
  }, [changeSet, autoSave, autoSaveDelayMs, onStateChange]);

  const updateChangeSet = useCallback(
    (updater: (current: DocumentChangeSet) => DocumentChangeSet) => {
      setChangeSet((current) => {
        if (!current) return null;

        const updated = updater(current);
        onStateChange?.(updated);
        return updated;
      });
    },
    [onStateChange]
  );

  const createFile = useCallback(
    (path: FilePath, content: FileContent, section?: SectionTitle) => {
      updateChangeSet((current) =>
        current.addChange({
          type: "file:create",
          path,
          content,
          section,
        })
      );
    },
    [updateChangeSet]
  );

  const updateFile = useCallback(
    (path: FilePath, content: FileContent) => {
      updateChangeSet((current) =>
        current.addChange({
          type: "file:update",
          path,
          content,
        })
      );
    },
    [updateChangeSet]
  );

  const deleteFile = useCallback(
    (path: FilePath) => {
      updateChangeSet((current) =>
        current.addChange({
          type: "file:delete",
          path,
        })
      );
    },
    [updateChangeSet]
  );

  const addPageToDocsYml = useCallback(
    (pagePath: FilePath, section: SectionTitle) => {
      updateChangeSet((current) =>
        current.addChange({
          type: "docs.yml:add-page",
          pagePath,
          section,
        })
      );
    },
    [updateChangeSet]
  );

  const removePageFromDocsYml = useCallback(
    (pagePath: FilePath) => {
      updateChangeSet((current) =>
        current.addChange({
          type: "docs.yml:remove-page",
          pagePath,
        })
      );
    },
    [updateChangeSet]
  );

  const getFileContent = useCallback(
    (path: FilePath): FileContent | undefined => {
      return changeSet?.getFileContent(path);
    },
    [changeSet]
  );

  const hasChanges = useCallback((): boolean => {
    return changeSet?.hasChanges() ?? false;
  }, [changeSet]);

  const getCommitPlan = useCallback((): CommitPlan => {
    return (
      changeSet?.getCommitPlan() ?? {
        filesToCommit: new Map(),
        filesToDelete: [],
        hasChanges: false,
      }
    );
  }, [changeSet]);

  const clearAllChanges = useCallback(() => {
    if (changeSet) {
      const clearedChangeSet = changeTracker.createChangeSet(
        changeSet.baseState
      );
      setChangeSet(clearedChangeSet);
      config.onStateChange?.(clearedChangeSet);
    }
  }, [changeSet, changeTracker, config]);

  const undoLastChange = useCallback(() => {
    updateChangeSet((current) => {
      if (current.changes.length === 0) return current;

      const lastChange = current.changes[current.changes.length - 1];
      if (lastChange) {
        return current.removeChange(lastChange.id);
      }
      return current;
    });
  }, [updateChangeSet]);

  return {
    changeSet,
    isLoading,

    // File operations
    createFile,
    updateFile,
    deleteFile,

    // Docs.yml operations
    addPageToDocsYml,
    removePageFromDocsYml,

    // Query methods
    getFileContent,
    hasChanges,
    getCommitPlan,

    // State management
    clearAllChanges,
    undoLastChange,

    error,
  };
}

/**
 * Hook for getting change history and analytics
 */
export function useChangeHistory(changeSet: DocumentChangeSet | null): {
  totalChanges: number;
  changesByType: Record<string, number>;
  recentChanges: Change[];
  changedFiles: FilePath[];
} {
  return useMemo(() => {
    if (!changeSet) {
      return {
        totalChanges: 0,
        changesByType: {},
        recentChanges: [],
        changedFiles: [],
      };
    }

    const changesByType: Record<string, number> = {};
    const changedFiles = new Set<FilePath>();

    for (const change of changeSet.changes) {
      changesByType[change.type] = (changesByType[change.type] ?? 0) + 1;

      if (change.type.startsWith("file:")) {
        changedFiles.add((change as any).path);
      }
    }

    const recentChanges = changeSet.changes
      .slice(-10)
      .sort((a, b) => b.timestamp - a.timestamp);

    return {
      totalChanges: changeSet.changes.length,
      changesByType,
      recentChanges,
      changedFiles: Array.from(changedFiles),
    };
  }, [changeSet]);
}
