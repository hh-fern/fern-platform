import { DocumentChangeTracker } from "./DocumentChangeTracker";
import { BaseState, Change, DocumentChangeSet } from "./types";

/**
 * Legacy storage formats - these match the existing system types
 */

// From MdxStateContext
export interface LegacyMdxDependencies {
  html?: string;
  frontmatter?: any;
  originalElements?: any;
  changed?: boolean;
  changedNodes?: any;
  changedFrontmatter?: boolean;
}

// From ClientPageStorage
export interface LegacyStoredClientPage {
  node: any; // FernNavigation.PageNode
  parentNodeId: string;
  sidebar?: any; // FernNavigation.SidebarRootNode
  createdAt: number;
  fullSlug: string;
  pageData?: {
    html: string;
    frontmatter: any;
    originalElements: any;
  };
  navigationContext?: any;
}

// From DocsYmlStorage
export interface LegacyDocsYmlState {
  baseContent: string;
  updates: Record<string, LegacyDocsYmlUpdate>;
  lastFetched: number;
}

export interface LegacyDocsYmlUpdate {
  sectionTitle: string;
  pageEntry: {
    page: string;
    path: string;
  };
  createdAt: number;
  operation: "add" | "remove";
}

// From PageStorage
export interface LegacyStoredPageData {
  html: string;
  frontmatter: any;
  originalElements: any;
  lastModified: number;
  pageType: "client" | "server";
  serverData?: any;
}

/**
 * Utility functions to convert from legacy formats to new change tracking system
 */

/**
 * Converts legacy MDX state to change set
 */
export function convertMdxStateToChangeSet(
  mdxDepsStore: Record<string, LegacyMdxDependencies>,
  baseFiles: Map<string, string>,
  docsYml: string,
  tracker: DocumentChangeTracker
): DocumentChangeSet {
  const baseState: BaseState = {
    files: baseFiles,
    docsYml,
  };

  let changeSet = tracker.createChangeSet(baseState);

  // Convert changed MDX files to update changes
  for (const [filename, deps] of Object.entries(mdxDepsStore)) {
    if (
      deps.changed &&
      deps.html &&
      deps.frontmatter &&
      deps.originalElements
    ) {
      // Convert HTML back to MDX using existing htmlToMdx logic
      const mdxContent = convertHtmlToMdx(
        deps.html,
        deps.frontmatter,
        deps.originalElements
      );

      // Check if this is a new file or an update
      const isNewFile = !baseFiles.has(filename);

      changeSet = changeSet.addChange({
        type: isNewFile ? "file:create" : "file:update",
        path: filename,
        content: mdxContent,
        ...(isNewFile && { section: "General" }), // Default section for new files
      });
    }
  }

  return changeSet;
}

/**
 * Converts legacy client pages to change set
 */
export function convertClientPagesToChangeSet(
  clientPages: Record<string, LegacyStoredClientPage>,
  baseState: BaseState,
  tracker: DocumentChangeTracker
): DocumentChangeSet {
  let changeSet = tracker.createChangeSet(baseState);

  for (const [_, clientPage] of Object.entries(clientPages)) {
    if (clientPage.pageData && clientPage.fullSlug) {
      const filename = getPageFilename(clientPage.fullSlug);
      const mdxContent = convertPageDataToMdx(clientPage.pageData);
      const section = extractSectionFromClientPage(clientPage);

      changeSet = changeSet.addChange({
        type: "file:create",
        path: filename,
        content: mdxContent,
        section,
      });

      // Add docs.yml change for the new page
      changeSet = changeSet.addChange({
        type: "docs.yml:add-page",
        pagePath: `${clientPage.fullSlug}.mdx`,
        section,
      });
    }
  }

  return changeSet;
}

/**
 * Converts legacy docs.yml state to change set
 */
export function convertDocsYmlStateToChangeSet(
  docsYmlState: LegacyDocsYmlState,
  baseState: BaseState,
  tracker: DocumentChangeTracker
): DocumentChangeSet {
  let changeSet = tracker.createChangeSet({
    ...baseState,
    docsYml: docsYmlState.baseContent,
  });

  // Convert updates to changes, sorted by creation time
  const sortedUpdates = Object.entries(docsYmlState.updates)
    .map(([path, update]) => ({ path, ...update }))
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

  for (const update of sortedUpdates) {
    if (update.operation === "add") {
      changeSet = changeSet.addChange({
        type: "docs.yml:add-page",
        pagePath: update.path,
        section: update.sectionTitle,
      });
    } else if (update.operation === "remove") {
      changeSet = changeSet.addChange({
        type: "docs.yml:remove-page",
        pagePath: update.path,
      });
    }
  }

  return changeSet;
}

/**
 * Merges multiple legacy change sets into a single unified change set
 */
export function mergeLegacyChangeSets(
  mdxChanges: DocumentChangeSet,
  clientPageChanges: DocumentChangeSet,
  docsYmlChanges: DocumentChangeSet,
  tracker: DocumentChangeTracker
): DocumentChangeSet {
  const baseState = mdxChanges.baseState;
  let mergedChangeSet = tracker.createChangeSet(baseState);

  // Collect all changes with their timestamps
  const allChanges: (Change & { source: string })[] = [
    ...mdxChanges.changes.map((c) => ({ ...c, source: "mdx" })),
    ...clientPageChanges.changes.map((c) => ({ ...c, source: "client" })),
    ...docsYmlChanges.changes.map((c) => ({ ...c, source: "docs.yml" })),
  ];

  // Sort all changes by timestamp
  allChanges.sort((a, b) => a.timestamp - b.timestamp);

  // Apply changes in chronological order
  for (const change of allChanges) {
    const { source, ...changeWithoutSource } = change;
    mergedChangeSet = mergedChangeSet.addChange(changeWithoutSource);
  }

  // Compact the changes to remove redundancies
  return tracker.compactChanges(mergedChangeSet);
}

/**
 * Creates a migration plan from legacy storage to new system
 */
export interface MigrationPlan {
  hasLegacyData: boolean;
  legacySources: string[];
  estimatedChanges: number;
  canAutoMigrate: boolean;
  warnings: string[];
}

export function createMigrationPlan(
  branchName: string,
  legacyStorageChecks: {
    hasMdxState: boolean;
    hasClientPages: boolean;
    hasDocsYmlState: boolean;
    hasPageStorage: boolean;
    hasCommittedFiles: boolean;
  }
): MigrationPlan {
  const sources: string[] = [];
  const warnings: string[] = [];
  let estimatedChanges = 0;

  if (legacyStorageChecks.hasMdxState) {
    sources.push("MDX State");
    estimatedChanges += 10; // Estimated based on typical usage
  }

  if (legacyStorageChecks.hasClientPages) {
    sources.push("Client Pages");
    estimatedChanges += 5;
  }

  if (legacyStorageChecks.hasDocsYmlState) {
    sources.push("Docs.yml Changes");
    estimatedChanges += 3;
  }

  if (legacyStorageChecks.hasPageStorage) {
    sources.push("Page Storage");
    estimatedChanges += 8;
    warnings.push("Page storage may conflict with MDX state");
  }

  if (legacyStorageChecks.hasCommittedFiles) {
    sources.push("Committed Files Tracking");
    warnings.push("Committed files tracking will be replaced by change log");
  }

  const hasLegacyData = sources.length > 0;
  const canAutoMigrate = hasLegacyData && warnings.length === 0;

  if (sources.length > 2) {
    warnings.push(
      "Multiple legacy storage sources detected - migration may be complex"
    );
  }

  return {
    hasLegacyData,
    legacySources: sources,
    estimatedChanges,
    canAutoMigrate,
    warnings,
  };
}

/**
 * Executes migration from legacy storage to new change tracking system
 */
export async function executeMigration(
  branchName: string,
  legacyData: {
    mdxDepsStore?: Record<string, LegacyMdxDependencies>;
    clientPages?: Record<string, LegacyStoredClientPage>;
    docsYmlState?: LegacyDocsYmlState;
    pageStorage?: Record<string, LegacyStoredPageData>;
  },
  baseState: BaseState,
  tracker: DocumentChangeTracker
): Promise<{
  success: boolean;
  changeSet?: DocumentChangeSet;
  error?: string;
  migrationSummary?: {
    totalChanges: number;
    changesByType: Record<string, number>;
  };
}> {
  try {
    const changeSetsToMerge: DocumentChangeSet[] = [];

    // Convert MDX state
    if (legacyData.mdxDepsStore) {
      const mdxChangeSet = convertMdxStateToChangeSet(
        legacyData.mdxDepsStore,
        baseState.files,
        baseState.docsYml,
        tracker
      );
      changeSetsToMerge.push(mdxChangeSet);
    }

    // Convert client pages
    if (legacyData.clientPages) {
      const clientChangeSet = convertClientPagesToChangeSet(
        legacyData.clientPages,
        baseState,
        tracker
      );
      changeSetsToMerge.push(clientChangeSet);
    }

    // Convert docs.yml state
    if (legacyData.docsYmlState) {
      const docsYmlChangeSet = convertDocsYmlStateToChangeSet(
        legacyData.docsYmlState,
        baseState,
        tracker
      );
      changeSetsToMerge.push(docsYmlChangeSet);
    }

    // Merge all change sets
    let finalChangeSet = tracker.createChangeSet(baseState);
    if (changeSetsToMerge.length > 0) {
      // Start with the first change set
      const firstChangeSet = changeSetsToMerge[0];
      if (firstChangeSet) {
        finalChangeSet = firstChangeSet;

        // Merge additional change sets
        for (let i = 1; i < changeSetsToMerge.length; i++) {
          const changeSetToMerge = changeSetsToMerge[i];
          if (changeSetToMerge) {
            finalChangeSet = mergeLegacyChangeSets(
              finalChangeSet,
              changeSetToMerge,
              tracker.createChangeSet(baseState),
              tracker
            );
          }
        }
      }
    }

    // Generate migration summary
    const changesByType: Record<string, number> = {};
    for (const change of finalChangeSet.changes) {
      changesByType[change.type] = (changesByType[change.type] || 0) + 1;
    }

    return {
      success: true,
      changeSet: finalChangeSet,
      migrationSummary: {
        totalChanges: finalChangeSet.changes.length,
        changesByType,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Migration failed",
    };
  }
}

// Helper functions (these would use existing utility functions from the codebase)

function convertHtmlToMdx(html: string, frontmatter: any, _: any): string {
  // This would use the existing htmlToMdx function
  // Placeholder implementation
  return `---\ntitle: ${frontmatter?.title || "Untitled"}\n---\n\n${html}`;
}

function convertPageDataToMdx(pageData: {
  html: string;
  frontmatter: any;
  originalElements: any;
}): string {
  return convertHtmlToMdx(
    pageData.html,
    pageData.frontmatter,
    pageData.originalElements
  );
}

function getPageFilename(fullSlug: string): string {
  // Extract filename from slug
  return `${fullSlug}.mdx`;
}

function extractSectionFromClientPage(_: LegacyStoredClientPage): string {
  // Extract section from client page metadata
  return "General"; // Default section
}
