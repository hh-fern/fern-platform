"use client";

import { useEffect, useMemo, useRef } from "react";

import { NodeId } from "@fern-api/fdr-sdk/navigation";
import { useDocumentChanges, type BaseState } from "@fern-docs/components";
import { MdxToHtmlResponse } from "@fern-docs/mdx";

import { useCurrentPage } from "@/providers/CurrentPageContext";
import { useMdxState } from "@/providers/MdxStateContext";
import { useOriginalElements } from "@/providers/OriginalElementsContext";
import { useSidebarClientNavigation } from "@fern-docs/components/sidebar/nodes/SidebarClientNavigationProvider";
import { useBranch } from "@/providers/BranchContext";

import PageEditor from "./PageEditor";
import PageSubtitle from "./PageSubtitle";
import PageTitle from "./PageTitle";
import { bundleOriginalElements } from "./bundleOriginalElements";

export declare namespace PageContents {
  export interface Props {
    filename: string;
    initialHtml: MdxToHtmlResponse["html"];
    initialFrontmatter: MdxToHtmlResponse["frontmatter"];
    initialOriginalElements: MdxToHtmlResponse["originalElements"];
    initialOriginalFrontmatter: MdxToHtmlResponse["originalFrontmatter"];
    clientNodeId?: NodeId;
    serverData?: {
      html: string;
      frontmatter: Record<string, any>;
      originalElements: any;
    };
  }
}

export default function PageContents({
  filename,
  initialHtml,
  initialFrontmatter,
  initialOriginalElements,
  initialOriginalFrontmatter,
  clientNodeId,
  serverData,
}: PageContents.Props) {
  const { title, subtitle } = initialFrontmatter ?? {};

  const { setCurrentFilename } = useCurrentPage();
  const {
    updateDependencies,
    changedMdxFiles,
    syncChanges,
    mdxDepsStore,
    stageChanges,
  } = useMdxState();
  const { branch } = useBranch();
  const { updateClientPageData } = useSidebarClientNavigation();

  // Initialize base state for new document change tracking
  const baseState: BaseState = useMemo(
    () => ({
      files: new Map(),
      docsYml: "",
    }),
    []
  );

  // Use new document changes system
  const { updateFile, getFileContent: _getFileContent } = useDocumentChanges(baseState, {
    branchId: branch || "default",
    autoSave: true,
    autoSaveDelayMs: 300,
  });

  // Sync page changes to localStorage and staging (works for both client and server pages)
  const pageData = useMemo(() => {
    const currentPageData = mdxDepsStore[filename];
    return {
      html: currentPageData?.html,
      frontmatter: currentPageData?.frontmatter,
      originalElements: currentPageData?.originalElements,
    };
  }, [mdxDepsStore, filename]);

  // Track what we've already synced to prevent infinite loops
  const lastSyncedData = useRef<string>("");
  const hasStagedChanges = useRef<boolean>(false);
  const lastStagedDataHash = useRef<string>("");

  // Replace usePageSync with new document change tracking
  useEffect(() => {
    // Only sync if we have the required data
    if (
      !branch ||
      !pageData.html ||
      !pageData.frontmatter ||
      !pageData.originalElements
    ) {
      return;
    }

    const completePageData = pageData as {
      html: string;
      frontmatter: Record<string, any>;
      originalElements: any;
    };

    // Create a hash of the current data to detect changes
    const currentDataHash = JSON.stringify({
      html: completePageData.html,
      frontmatter: completePageData.frontmatter,
      originalElements: completePageData.originalElements,
    });

    // Skip if we've already synced this exact data
    if (lastSyncedData.current === currentDataHash) {
      return;
    }

    lastSyncedData.current = currentDataHash;

    // Reset staging flag when data actually changes
    if (lastStagedDataHash.current !== currentDataHash) {
      hasStagedChanges.current = false;
    }

    if (clientNodeId) {
      // This is a client page - update client navigation data
      if (updateClientPageData) {
        updateClientPageData(clientNodeId, completePageData);
      }
    }

    // Convert page data to MDX content and update in new system
    const mdxContent = `---
${Object.entries(completePageData.frontmatter)
  .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
  .join('\n')}
---

${completePageData.html}`;

    updateFile(filename, mdxContent);

    // Stage changes for commit
    if (stageChanges && lastStagedDataHash.current !== currentDataHash) {
      let shouldStage = false;

      if (clientNodeId) {
        // Always stage client pages since they don't exist on server
        shouldStage = true;
      } else if (serverData) {
        // For server pages, check if data differs from server
        const dataHasChanges =
          completePageData.html !== serverData.html ||
          JSON.stringify(completePageData.frontmatter) !==
            JSON.stringify(serverData.frontmatter) ||
          JSON.stringify(completePageData.originalElements) !==
            JSON.stringify(serverData.originalElements);

        shouldStage = dataHasChanges;
      } else {
        // Server page without server data - stage to be safe
        shouldStage = true;
      }

      if (shouldStage) {
        stageChanges(filename, {
          html: completePageData.html,
          frontmatter: completePageData.frontmatter,
          originalElements: completePageData.originalElements,
          changed: true,
        });
        lastStagedDataHash.current = currentDataHash;
        hasStagedChanges.current = true;
      }
    }
  }, [
    clientNodeId,
    branch,
    filename,
    pageData,
    updateClientPageData,
    stageChanges,
    serverData,
    updateFile,
  ]);

  const { originalElements, setOriginalElements } = useOriginalElements();

  // Track what we've already bundled to prevent infinite loops
  const bundledElementsRef = useRef<string>("");

  useEffect(() => {
    // Create a stable hash of the original elements to detect actual changes
    const elementsHash = JSON.stringify(
      Object.entries(originalElements).map(([key, element]) => [
        key,
        element.content,
      ])
    );

    // Only bundle if content has actually changed and elements need bundling
    const needsBundling = Object.values(originalElements).some(
      (element) => !element.code
    );

    if (needsBundling && bundledElementsRef.current !== elementsHash) {
      bundledElementsRef.current = elementsHash;
      // IMPORTANT: This fix prevents async state updates from triggering
      // during error boundary recovery by:

      // 1. Adding cancellation token to track if the
      // component/effect should still update state
      // 2. Cleanup function that cancels pending async
      // operations when effect dependencies change (including
      // during error boundary recovery)
      // 3. Conditional state update that only proceeds if not
      // cancelled

      // Now when an error boundary recovers and triggers
      // re-renders, any pending bundleOriginalElements promises
      //  won't cause state updates that could interfere with
      // React's hook reconciliation.
      let cancelled = false;

      void bundleOriginalElements(originalElements).then((bundled) => {
        // Prevent state updates after component unmounts or error boundary recovery
        if (!cancelled) {
          setOriginalElements(bundled);
        }
      });

      // Cleanup function to prevent state updates during error boundary recovery
      return () => {
        cancelled = true;
      };
    }

    // Return undefined when no bundling is needed
    return undefined;
  }, [originalElements, setOriginalElements]);

  useEffect(() => {
    // Set this as the current active page
    setCurrentFilename(filename);
    updateDependencies(filename, {
      html: initialHtml,
      frontmatter: initialFrontmatter,
      originalElements: initialOriginalElements,
      originalFrontmatter: initialOriginalFrontmatter,
    });
  }, [
    filename,
    initialHtml,
    initialFrontmatter,
    initialOriginalElements,
    initialOriginalFrontmatter,
    updateDependencies,
    setCurrentFilename,
  ]);

  const changedMdxFile = changedMdxFiles[filename];
  const lastSyncedContent = useRef<string | undefined>(undefined);

  // Watch for changes and sync to server - only sync if content actually changed
  useEffect(() => {
    if (changedMdxFile && changedMdxFile !== lastSyncedContent.current) {
      lastSyncedContent.current = changedMdxFile;
      syncChanges(filename);
    }
  }, [changedMdxFile, filename, syncChanges]);

  return (
    <div className="max-w-content-width-wide mx-auto w-full">
      <PageTitle
        className="w-full"
        filename={filename}
        initialText={title ? String(title) : undefined}
      />
      <PageSubtitle
        className="w-full"
        filename={filename}
        initialText={subtitle ? String(subtitle) : undefined}
      />
      <PageEditor
        className="w-full"
        filename={filename}
        initialHtml={initialHtml}
      />
    </div>
  );
}
