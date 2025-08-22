"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { FernNavigation } from "@fern-api/fdr-sdk";
import { NodeId } from "@fern-api/fdr-sdk/navigation";

import { type BaseState, useDocumentChanges } from "../../document-changes";
import { NavigationContext, PageData } from "./types";

// Simple localStorage interface for client pages
interface StoredClientPage {
  node: FernNavigation.PageNode;
  parentNodeId: NodeId;
  sidebar?: FernNavigation.SidebarRootNode;
  pageData?: PageData;
  fullSlug: string;
  navigationContext?: NavigationContext;
  createdAt: number;
}

// Client page helper functions using localStorage directly (temporary until full migration)
function loadClientPages(branchName: string): Record<string, StoredClientPage> {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem(`client-pages-${branchName}`);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error("Failed to load client pages:", error);
    return {};
  }
}

function addClientPage(
  branchName: string,
  nodeId: NodeId,
  pageData: StoredClientPage
) {
  if (typeof window === "undefined") return;
  try {
    const existing = loadClientPages(branchName);
    existing[nodeId] = { ...pageData, createdAt: Date.now() };
    localStorage.setItem(
      `client-pages-${branchName}`,
      JSON.stringify(existing)
    );
  } catch (error) {
    console.error("Failed to save client page:", error);
  }
}

function removeClientPage(branchName: string, nodeId: NodeId) {
  if (typeof window === "undefined") return;
  try {
    const existing = loadClientPages(branchName);
    const { [nodeId]: removed, ...newExisting } = existing;
    localStorage.setItem(
      `client-pages-${branchName}`,
      JSON.stringify(newExisting)
    );
  } catch (error) {
    console.error("Failed to remove client page:", error);
  }
}

function updateClientPageDataInStorage(
  branchName: string,
  nodeId: NodeId,
  pageData: PageData
) {
  if (typeof window === "undefined") return;
  try {
    const existing = loadClientPages(branchName);
    if (existing[nodeId]) {
      existing[nodeId].pageData = pageData;
      localStorage.setItem(
        `client-pages-${branchName}`,
        JSON.stringify(existing)
      );
    }
  } catch (error) {
    console.error("Failed to update client page data:", error);
  }
}

type ClientNodes = Record<NodeId, FernNavigation.PageNode[]>;

type ClientFoundNodes = Record<NodeId, FernNavigation.utils.Node.Found>;

interface SidebarClientNavigationContextValue {
  clientNodes?: ClientNodes;
  clientFoundNodes?: ClientFoundNodes;
  isInitialized?: boolean;
  prependClientNode?: (
    parentNodeId: NodeId,
    node: FernNavigation.PageNode,
    sidebar?: FernNavigation.SidebarRootNode,
    pageData?: PageData,
    fullSlug?: string,
    navigationContext?: NavigationContext
  ) => Promise<void>;
  removeClientNode?: (nodeId: NodeId) => Promise<void>;
  updateClientPageData?: (nodeId: NodeId, pageData: PageData) => Promise<void>;
}

const SidebarClientNavigationContext =
  createContext<SidebarClientNavigationContextValue>({});

interface SidebarClientNavigationProviderProps {
  children: React.ReactNode;
  branchName: string;
}

// Helper function to load and process stored client pages
function loadAndProcessStoredPages(branchName: string) {
  // During SSR, localStorage is not available, so return empty objects
  if (typeof window === "undefined") {
    return { clientNodes: {}, clientFoundNodes: {} };
  }

  const storedPages = loadClientPages(branchName);

  const clientNodes: ClientNodes = {};
  const clientFoundNodes: ClientFoundNodes = {};

  // Sort stored pages by creation time (newest first) to preserve order
  const sortedEntries = Object.entries(storedPages).sort(
    ([, a], [, b]) => (b.createdAt || 0) - (a.createdAt || 0)
  );

  sortedEntries.forEach(([nodeId, storedPage]) => {
    const { node, parentNodeId, sidebar, navigationContext } = storedPage;

    // Add to clientNodes grouped by parent
    if (!clientNodes[parentNodeId]) {
      clientNodes[parentNodeId] = [];
    }
    clientNodes[parentNodeId].push(node);

    // Add to clientFoundNodes with stored navigation context
    clientFoundNodes[nodeId as NodeId] = {
      type: "found",
      node,
      sidebar,
      currentProduct: navigationContext?.currentProduct,
      currentVersion: navigationContext?.currentVersion,
      currentTab: navigationContext?.currentTab,
      isCurrentVersionDefault:
        navigationContext?.isCurrentVersionDefault ?? false,
      isCurrentProductDefault:
        navigationContext?.isCurrentProductDefault ?? false,
    } as FernNavigation.utils.Node.Found;
  });

  return { clientNodes, clientFoundNodes };
}

export function SidebarClientNavigationProvider({
  children,
  branchName,
}: SidebarClientNavigationProviderProps) {
  // Initialize base state for document changes integration
  const baseState: BaseState = useMemo(
    () => ({
      files: new Map(),
      docsYml: "",
    }),
    []
  );

  // Integrate with document changes system
  const { createFile, deleteFile, addPageToDocsYml, removePageFromDocsYml } =
    useDocumentChanges(baseState, {
      branchId: branchName,
      autoSave: true,
      autoSaveDelayMs: 300,
    });

  // Lazy initialization to load client pages synchronously on first access
  const [state, setState] = useState<{
    clientNodes: ClientNodes;
    clientFoundNodes: ClientFoundNodes;
    isInitialized: boolean;
  }>(() => {
    const { clientNodes, clientFoundNodes } =
      loadAndProcessStoredPages(branchName);

    return {
      clientNodes,
      clientFoundNodes,
      isInitialized: true,
    };
  });

  // Update state when branchName changes
  useEffect(() => {
    const {
      clientNodes: newClientNodes,
      clientFoundNodes: newClientFoundNodes,
    } = loadAndProcessStoredPages(branchName);

    setState({
      clientNodes: newClientNodes,
      clientFoundNodes: newClientFoundNodes,
      isInitialized: true,
    });
  }, [branchName]);

  const { clientNodes, clientFoundNodes, isInitialized } = state;

  const prependClientNode = useCallback(
    async (
      parentNodeId: NodeId,
      node: FernNavigation.PageNode,
      sidebar?: FernNavigation.SidebarRootNode,
      pageData?: PageData,
      fullSlug?: string,
      navigationContext?: NavigationContext
    ) => {
      // Update local state
      setState((prevState) => ({
        ...prevState,
        clientNodes: {
          ...prevState.clientNodes,
          [parentNodeId]: [
            node,
            ...(prevState.clientNodes[parentNodeId] || []),
          ],
        },
        clientFoundNodes: {
          ...prevState.clientFoundNodes,
          [node.id]: {
            type: "found",
            node,
            sidebar,
            currentProduct: navigationContext?.currentProduct,
            currentVersion: navigationContext?.currentVersion,
            currentTab: navigationContext?.currentTab,
            isCurrentVersionDefault:
              navigationContext?.isCurrentVersionDefault ?? false,
            isCurrentProductDefault:
              navigationContext?.isCurrentProductDefault ?? false,
          } as FernNavigation.utils.Node.Found,
        },
      }));

      const fileName = `${fullSlug || node.slug || "untitled"}.mdx`;

      // Integrate with document changes system
      if (pageData) {
        // Create MDX content from page data
        const mdxContent = `---
title: ${node.title}
${Object.entries(pageData.frontmatter || {})
  .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
  .join("\n")}
---

${pageData.html || ""}`;

        // Track as document change
        createFile(fileName, mdxContent, node.title);
        addPageToDocsYml(fileName, node.title);
      }

      // Persist to localStorage
      addClientPage(branchName, node.id, {
        node,
        parentNodeId,
        sidebar,
        pageData,
        fullSlug: fullSlug || node.slug || "",
        navigationContext,
        createdAt: Date.now(),
      });
    },
    [branchName, createFile, addPageToDocsYml]
  );

  const removeClientNode = useCallback(
    async (nodeId: NodeId) => {
      // Get the page data before removal for document changes
      const storedPages = loadClientPages(branchName);
      const pageToRemove = storedPages[nodeId];
      const fileName = pageToRemove?.fullSlug
        ? `${pageToRemove.fullSlug}.mdx`
        : `${nodeId}.mdx`;

      setState((prevState) => {
        // Find the parent node ID to remove from clientNodes
        let parentNodeId: NodeId | undefined;
        for (const [parent, nodes] of Object.entries(prevState.clientNodes)) {
          if (nodes.some((n) => n.id === nodeId)) {
            parentNodeId = parent as NodeId;
            break;
          }
        }

        const newClientNodes = { ...prevState.clientNodes };
        if (parentNodeId) {
          newClientNodes[parentNodeId] = (
            prevState.clientNodes[parentNodeId] || []
          ).filter((n) => n.id !== nodeId);
        }

        const { [nodeId]: removed, ...newClientFoundNodes } =
          prevState.clientFoundNodes;

        return {
          ...prevState,
          clientNodes: newClientNodes,
          clientFoundNodes: newClientFoundNodes,
        };
      });

      // Integrate with document changes system
      deleteFile(fileName);
      removePageFromDocsYml(fileName);

      // Remove from localStorage
      removeClientPage(branchName, nodeId);
    },
    [branchName, deleteFile, removePageFromDocsYml]
  );

  const updateClientPageData = useCallback(
    async (nodeId: NodeId, pageData: PageData) => {
      // Get current page data to create file name
      const storedPages = loadClientPages(branchName);
      const currentPage = storedPages[nodeId];
      const fileName = currentPage?.fullSlug
        ? `${currentPage.fullSlug}.mdx`
        : `${nodeId}.mdx`;

      // Create updated MDX content
      const mdxContent = `---
title: ${currentPage?.node.title || "Untitled"}
${Object.entries(pageData.frontmatter || {})
  .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
  .join("\n")}
---

${pageData.html || ""}`;

      // Update in document changes system
      createFile(fileName, mdxContent);

      // Update localStorage
      updateClientPageDataInStorage(branchName, nodeId, pageData);
    },
    [branchName, createFile]
  );

  const contextValue = useMemo(
    () => ({
      clientNodes,
      clientFoundNodes,
      isInitialized,
      prependClientNode,
      removeClientNode,
      updateClientPageData,
    }),
    [
      clientNodes,
      clientFoundNodes,
      isInitialized,
      prependClientNode,
      removeClientNode,
      updateClientPageData,
    ]
  );

  return (
    <SidebarClientNavigationContext.Provider value={contextValue}>
      {children}
    </SidebarClientNavigationContext.Provider>
  );
}

export function useSidebarClientNavigation() {
  const context = useContext(SidebarClientNavigationContext);

  // no-op when provider isn't available e.g. in production docs (SSR) environment
  return context;
}
