/**
 * Example usage of the new document change tracking system
 * This shows how the new architecture would replace the existing system
 */
import {
  BaseState,
  CommitOrchestrator,
  DocsYmlUpdater,
  DocumentChangeTracker,
  EditorStateManager,
  GitHubApi,
  LocalStorageChangeStorage,
  useDocumentChanges,
} from "./index";
import { executeMigration } from "./migration";

// Example: Setting up the new system

export function setupNewChangeTracking() {
  // 1. Create core components
  const changeTracker = new DocumentChangeTracker({
    autoCompact: true,
    maxChanges: 1000,
  });

  const storage = new LocalStorageChangeStorage();

  // 2. Create editor state manager
  const editorStateManager = new EditorStateManager(changeTracker, storage);

  // 3. Setup commit orchestrator (would integrate with existing GitHub API)
  const githubApi: GitHubApi = {
    createCommit: async () => {
      // This would integrate with existing DashboardApiClient.postGitCommit
      return { success: true, commitSha: "abc123" };
    },
  };

  const docsYmlUpdater: DocsYmlUpdater = {
    addPageToDocsYml: (content, section, pageEntry) => {
      // This would use existing addPageToDocsYml function
      return content + `\n  - page: ${pageEntry.page}`;
    },
    removePageFromDocsYml: (content, pagePath) => {
      // This would use existing removePageFromDocsYml function
      return content.replace(`\n  - page: ${pagePath}`, "");
    },
    parseYaml: () => {
      // This would use existing parseYaml function
      return {};
    },
  };

  const commitOrchestrator = new CommitOrchestrator(
    githubApi,
    docsYmlUpdater,
    "Update documentation via Fern Editor"
  );

  return {
    changeTracker,
    storage,
    editorStateManager,
    commitOrchestrator,
  };
}

// Example: Using the system in a React component

export function useDocumentEditor(branchName: string) {
  const baseState: BaseState = {
    files: new Map([
      ["getting-started.mdx", "# Getting Started\nWelcome to our API"],
      ["api-reference.mdx", "# API Reference\nAPI documentation here"],
    ]),
    docsYml:
      "navigation:\n  - page: getting-started.mdx\n  - page: api-reference.mdx",
  };

  // This replaces the existing useMdxState hook
  const {
    isLoading,
    createFile,
    updateFile,
    deleteFile,
    getFileContent,
    hasChanges,
    getCommitPlan,
    error,
  } = useDocumentChanges(baseState, {
    branchId: branchName,
    autoSave: true,
    autoSaveDelayMs: 300,
    onError: (error) => console.error("Document change error:", error),
    onStateChange: (changeSet) =>
      console.log("Changes updated:", changeSet.changes.length),
  });

  return {
    // Current file contents
    getCurrentContent: (path: string) => getFileContent(path),

    // File operations (replaces existing stageChanges)
    createPage: (path: string, content: string, section?: string) => {
      createFile(path, content, section);
    },

    updatePage: (path: string, content: string) => {
      updateFile(path, content);
    },

    deletePage: (path: string) => {
      deleteFile(path);
    },

    // State queries
    hasUnsavedChanges: hasChanges,
    getCommitPreview: getCommitPlan,

    // Loading states
    isLoading,
    error,
  };
}

// Example: Committing changes (replaces existing CommitButton logic)

export async function commitDocumentChanges(
  changeSet: any, // DocumentChangeSet
  config: {
    owner: string;
    repo: string;
    branch: string;
    message?: string;
  }
) {
  const { commitOrchestrator } = setupNewChangeTracking();

  // Validate before committing
  const validation = commitOrchestrator.validateCommit(changeSet, config);
  if (!validation.valid) {
    throw new Error(
      `Commit validation failed: ${validation.errors.join(", ")}`
    );
  }

  // Preview what will be committed
  const preview = await commitOrchestrator.previewCommit(changeSet, config);
  console.log(`About to commit ${preview.totalFiles} files`, preview.files);

  // Execute the commit
  const result = await commitOrchestrator.commit(changeSet, {
    ...config,
    pathPrefix: "fern/", // Add fern/ prefix to all paths
  });

  if (result.success) {
    console.log("Commit successful:", result.commitSha);
    return result.commitSha;
  } else {
    throw new Error(`Commit failed: ${result.error}`);
  }
}

// Example: Migration from existing system

export async function migrateFromLegacyStorage(branchName: string) {
  const { changeTracker } = setupNewChangeTracking();

  // This would load data from the existing storage classes
  const legacyData = {
    // From MdxStateContext
    mdxDepsStore: {}, // Load from existing system

    // From ClientPageStorage
    clientPages: {}, // ClientPageStorage.loadClientPages(branchName)

    // From DocsYmlStorage
    docsYmlState: undefined, // DocsYmlStorage.loadState(branchName)

    // From PageStorage
    pageStorage: {}, // PageStorage.loadPages(branchName)
  };

  const baseState: BaseState = {
    files: new Map(), // Load from FDR/server
    docsYml: "", // Load from FDR/server
  };

  // Execute migration
  const migrationResult = await executeMigration(
    branchName,
    legacyData,
    baseState,
    changeTracker
  );

  if (migrationResult.success && migrationResult.changeSet) {
    console.log("Migration successful:", migrationResult.migrationSummary);

    // Save the migrated change set
    const storage = new LocalStorageChangeStorage();
    await storage.save(branchName, migrationResult.changeSet);

    // Clean up old storage
    // ClientPageStorage.clearAllClientPages(branchName);
    // DocsYmlStorage.clearAll(branchName);
    // etc.

    return migrationResult.changeSet;
  } else {
    throw new Error(`Migration failed: ${migrationResult.error}`);
  }
}

// Benefits demonstration:

/*
OLD SYSTEM PROBLEMS:
- 5 separate localStorage keys per branch
- Complex collectAllChanges function (400+ lines)
- Race conditions between storage layers  
- Duplicate file bugs (create->delete doesn't cancel out)
- Hard to test without full UI integration

NEW SYSTEM BENEFITS:
- Single storage location per branch
- Pure business logic (easily testable)
- Immutable change log (no race conditions)
- Automatic change compaction (create->delete = no net change)
- Clear separation of concerns (storage/logic/UI)
- Easy to add features like undo/redo

MIGRATION PATH:
1. Deploy new system alongside old system
2. Gradually migrate branches to new format
3. Update UI components to use new hooks
4. Remove old storage classes
5. Profit! 🎉
*/
