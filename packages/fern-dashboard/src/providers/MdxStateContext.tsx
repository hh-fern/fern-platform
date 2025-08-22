"use client";

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  type BaseState,
  type CommitPlan,
  type DocumentChangeSet,
  useDocumentChanges,
} from "@fern-docs/components";
import {
  ChangedNodes,
  MdxToHtmlResponse,
  htmlToMdx,
  mdxToHtml,
} from "@fern-docs/mdx";

import { createMdxFrontmatter } from "@/utils/createMdxFrontmatter";
import { DocsUrl } from "@/utils/types";

type Filename = string;
type Markdown = string;
type SyncedStatus = "STAGED" | "SYNCING" | "SYNCED" | "ERROR";

// Amount of time to wait before syncing mdx changes to the server
export const DEBOUNCE_TIMEOUT_DELAY = 300;

interface MdxDependencies {
  html?: MdxToHtmlResponse["html"];
  frontmatter?: MdxToHtmlResponse["frontmatter"];
  originalElements?: MdxToHtmlResponse["originalElements"];
  originalFrontmatter?: MdxToHtmlResponse["originalFrontmatter"];
  /**
   * Flag if the file should be considered changed.
   * This is used to determine if content changes should be committed to repo.
   */
  changed?: boolean;
  /**
   * Map of specific node that have changed.
   * This is used to determine if we should use the original MDX content formatting from originalElements.
   */
  changedNodes?: ChangedNodes;
  /**
   * Flag if the frontmatter has changed.
   * This is used to determine if we should use the original frontmatter formatting from originalFrontmatter.
   */
  changedFrontmatter?: boolean;
}

export const MdxStateContext = createContext<{
  changedMdxFiles: Record<Filename, Markdown>;
  allMdxFiles: Record<Filename, Markdown>;
  frontmatterData: Record<Filename, MdxToHtmlResponse["frontmatter"]>;
  mdxSyncedStatus: Record<Filename, SyncedStatus>;
  mdxDepsStore: Record<Filename, MdxDependencies>;
  updateDependencies: (filename: Filename, state: MdxDependencies) => void;
  stageChanges: (filename: Filename, state: MdxDependencies) => void;
  syncChanges: (filename: Filename) => Promise<void>;
  // Expose document changes system
  documentChanges: {
    changeSet: DocumentChangeSet | null;
    hasChanges: () => boolean;
    getCommitPlan: () => CommitPlan;
    isLoading: boolean;
  };
}>({
  changedMdxFiles: {},
  allMdxFiles: {},
  frontmatterData: {},
  mdxSyncedStatus: {},
  mdxDepsStore: {},
  updateDependencies: () => undefined,
  stageChanges: () => undefined,
  syncChanges: () => Promise.resolve(),
  documentChanges: {
    changeSet: null,
    hasChanges: () => false,
    getCommitPlan: () => ({
      filesToCommit: new Map(),
      filesToDelete: [],
      hasChanges: false,
    }),
    isLoading: false,
  },
});

export function MdxStateProvider({
  children,
  docsUrl: _docsUrl,
  branch,
}: {
  children: ReactNode;
  docsUrl: DocsUrl;
  branch: string;
}) {
  // HTML/MDX conversion state for editor compatibility
  const [mdxDepsStore, setMdxDepsStore] = useState<
    Record<Filename, MdxDependencies>
  >({});

  const [mdxSyncedStatus, setMdxSyncedStatus] = useState<
    Record<Filename, SyncedStatus>
  >({});

  const initialFrontmatter = useRef<
    Record<string, MdxToHtmlResponse["frontmatter"]>
  >({});

  // Track debounce timeouts for each file to prevent excessive syncs
  const debounceTimeouts = useRef<Record<string, NodeJS.Timeout | null>>({});

  // Initialize base state for new system
  const baseState: BaseState = useMemo(
    () => ({
      files: new Map(),
      docsYml: "", // Would be loaded from actual docs.yml
    }),
    []
  );

  // Stabilize config object to prevent infinite re-renders
  const documentChangesConfig = useMemo(() => {
    if (!branch) {
      throw new Error("Branch name is required for document changes tracking");
    }
    console.log(`[DEBUG] MdxStateContext using branchId: ${branch}`);
    return {
      branchId: branch,
      autoSave: true,
      autoSaveDelayMs: DEBOUNCE_TIMEOUT_DELAY,
      onError: (error: Error) => {
        console.error("Document change tracking error:", error);
      },
    };
  }, [branch]);

  // New document change tracking system
  const { changeSet, updateFile, hasChanges, getCommitPlan, isLoading } =
    useDocumentChanges(baseState, documentChangesConfig);

  // Stable updateDependencies identity to prevent unnecessary re-renders
  const updateDependencies = useCallback(
    (filename: Filename, state: MdxDependencies) => {
      setMdxDepsStore((prev) => {
        if (state.frontmatter && !initialFrontmatter.current[filename]) {
          // Store reference to initial frontmatter for changedFrontmatter comparison
          initialFrontmatter.current[filename] = state.frontmatter;
        }
        return {
          ...prev,
          [filename]: {
            html: state.html ?? prev[filename]?.html,
            frontmatter: (() => {
              const existingFrontmatter = prev[filename]?.frontmatter || {};
              const newFrontmatter = state.frontmatter || {};
              const mergedFrontmatter = {
                ...existingFrontmatter,
              };

              // Apply new frontmatter changes, removing fields with undefined values
              Object.entries(newFrontmatter).forEach(([key, value]) => {
                if (value == null) {
                  mergedFrontmatter[key] = key === "title" ? "" : undefined; // Always keep title field
                } else {
                  mergedFrontmatter[key] = value;
                }
              });

              return mergedFrontmatter;
            })(),
            originalElements:
              state.originalElements ?? prev[filename]?.originalElements,
            originalFrontmatter:
              state.originalFrontmatter ?? prev[filename]?.originalFrontmatter,
            changed: state.changed ?? prev[filename]?.changed,
            changedNodes: {
              ...prev[filename]?.changedNodes,
              ...state.changedNodes,
            },
            // If we're setting frontmatter, check if it's different from the initial frontmatter, otherwise use the previous value
            changedFrontmatter: state.frontmatter
              ? JSON.stringify(state.frontmatter) !==
                JSON.stringify(initialFrontmatter.current[filename])
              : (prev[filename]?.changedFrontmatter ?? false),
          },
        };
      });
    },
    [setMdxDepsStore]
  );

  // Process loaded changes into editor state when changeSet loads
  useEffect(() => {
    if (!changeSet || isLoading) return;

    console.log(
      `[DEBUG] Processing loaded changeSet with ${changeSet.changes.length} changes`
    );

    // Process each file change back into mdxDepsStore
    for (const change of changeSet.changes) {
      if (change.type === "file:update" || change.type === "file:create") {
        const filePath = change.path;
        const mdxContent = change.content;

        console.log(
          `[DEBUG] Converting loaded change back to editor state for ${filePath}`
        );

        // Convert MDX back to HTML for editor
        const { html, frontmatter, originalElements } = mdxToHtml(mdxContent, {
          treatAsCustomElement: ["code"],
          treatAsUnsupported: ["math"],
        });

        // Update the editor state with loaded changes
        updateDependencies(filePath, {
          html,
          frontmatter,
          originalElements,
          changed: true, // Mark as changed since it's from storage
        });
      }
    }
  }, [changeSet, isLoading, updateDependencies]);

  // Alias for updateDependencies that sets the changed flag to true by default
  const stageChanges = useCallback(
    (filename: Filename, state: MdxDependencies) => {
      updateDependencies(filename, { ...state, changed: true });

      // Immediately mark file as staged when changes are made
      setMdxSyncedStatus((prev) => ({
        ...prev,
        [filename]: "STAGED",
      }));

      // Update the new system - require at least html and frontmatter
      if (state.html && state.frontmatter) {
        const mdxContent = htmlToMdx(
          state.html,
          state.frontmatter,
          state.originalElements || {}, // Fallback to empty object if missing
          state.originalFrontmatter,
          state.changedNodes,
          true // Force frontmatter processing
        ).mdx;

        // Update the new change tracking system
        console.log(
          `[DEBUG] stageChanges calling updateFile for ${filename}:`,
          mdxContent.slice(0, 100) + "..."
        );
        updateFile(filename, mdxContent);
      } else {
        console.log(
          `[DEBUG] stageChanges skipped updateFile for ${filename}:`,
          {
            hasHtml: !!state.html,
            hasFrontmatter: !!state.frontmatter,
          }
        );
      }
    },
    [updateDependencies, updateFile]
  );

  // Build a map of changed files (changed flag is true) and their contents
  const changedMdxFiles = useMemo(() => {
    return Object.entries(mdxDepsStore).reduce<Record<Filename, Markdown>>(
      (acc, [filename, state]) => {
        if (
          state.changed &&
          state.html &&
          state.frontmatter &&
          state.originalElements
        ) {
          acc[filename] = htmlToMdx(
            state.html,
            state.frontmatter,
            state.originalElements,
            state.originalFrontmatter,
            state.changedNodes,
            true // Force frontmatter processing
          ).mdx;
        }
        return acc;
      },
      {}
    );
  }, [mdxDepsStore]);

  // Build a map of all files (both initial and changed) and their markdown contents
  const allMdxFiles = useMemo(() => {
    return Object.entries(mdxDepsStore).reduce<Record<Filename, Markdown>>(
      (acc, [filename, state]) => {
        if (state.html && state.frontmatter && state.originalElements) {
          acc[filename] = htmlToMdx(
            state.html,
            state.frontmatter,
            state.originalElements,
            state.originalFrontmatter,
            state.changedNodes,
            true
          ).mdx;
        } else if (state.html || state.frontmatter || state.originalElements) {
          // Generate minimal markdown when page data is incomplete
          const title = state.frontmatter?.title;
          const subtitle = state.frontmatter?.subtitle;
          const slug = state.frontmatter?.slug;
          acc[filename] = createMdxFrontmatter({
            title: typeof title === "string" ? title : "Untitled",
            subtitle: typeof subtitle === "string" ? subtitle : undefined,
            slug: typeof slug === "string" ? slug : undefined,
          });
        }
        return acc;
      },
      {}
    );
  }, [mdxDepsStore]);

  // Build a map of frontmatter data for all files
  const frontmatterData = useMemo(() => {
    return Object.entries(mdxDepsStore).reduce<
      Record<Filename, MdxToHtmlResponse["frontmatter"]>
    >((acc, [filename, state]) => {
      if (state.frontmatter) {
        acc[filename] = state.frontmatter;
      }
      return acc;
    }, {});
  }, [mdxDepsStore]);

  // Sync changes to the server via debounced setMdxFile server action
  const syncChanges = useCallback(
    async (filename: Filename) => {
      // Get content of file to sync
      const content = changedMdxFiles[filename];
      // Verify there is content to sync
      if (typeof content !== "undefined") {
        // Clear any existing timeout for this file
        const timeout = debounceTimeouts.current[filename];
        if (timeout) {
          clearTimeout(timeout);
        }
        // Set timeout to sync changes to the server
        debounceTimeouts.current[filename] = setTimeout(() => {
          setMdxSyncedStatus((prev) => ({
            ...prev,
            [filename]: "SYNCED",
          }));

          // Always clear the timeout on run
          debounceTimeouts.current[filename] = null;
        }, DEBOUNCE_TIMEOUT_DELAY);
      }
    },
    [changedMdxFiles]
  );

  return (
    <MdxStateContext.Provider
      value={{
        changedMdxFiles,
        allMdxFiles,
        frontmatterData,
        mdxSyncedStatus,
        mdxDepsStore,
        updateDependencies,
        stageChanges,
        syncChanges,
        documentChanges: {
          changeSet,
          hasChanges,
          getCommitPlan,
          isLoading,
        },
      }}
    >
      {children}
    </MdxStateContext.Provider>
  );
}

export function useMdxState() {
  return useContext(MdxStateContext);
}
