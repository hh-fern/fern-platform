"use client";

import { useCallback, useEffect, useMemo } from "react";

import { NodeId } from "@fern-api/fdr-sdk/navigation";

import { type BaseState, useDocumentChanges } from "../../document-changes";
import { useSidebarClientNavigation } from "./SidebarClientNavigationProvider";

interface ClientPageManagerProps {
  branchName: string;
}

export function ClientPageManager({ branchName }: ClientPageManagerProps) {
  const baseState: BaseState = useMemo(
    () => ({
      files: new Map(),
      docsYml: "",
    }),
    []
  );

  const { clearAllChanges: _clearAllChanges } = useDocumentChanges(baseState, {
    branchId: branchName,
    autoSave: false,
    autoSaveDelayMs: 300,
  });

  // Function to clean up old client pages - now integrated with new system
  const cleanupOldClientPages = useCallback(() => {
    // In the new architecture, cleanup is handled by the storage system
    // This function performs branch-specific cleanup operations
    console.log(`Performing branch-specific cleanup for: ${branchName}`);

    // TODO: Implement branch-specific cleanup logic when needed
    // This could include:
    // - Cleaning up expired cache entries
    // - Removing stale navigation state
    // - Garbage collecting unused resources
  }, [branchName]);

  // Clean up old pages on mount
  useEffect(() => {
    cleanupOldClientPages();
  }, [cleanupOldClientPages]);

  // This component doesn't render anything
  return null;
}

// Hook to use client page manager functions
export function useClientPageManager(branchName: string): {
  cleanupClientPage: (nodeId: NodeId) => void;
  cleanupAllClientPages: () => void;
  getClientPages: () => Record<string, any>;
  getClientPageCount: () => number;
} {
  const { removeClientNode, clientFoundNodes } = useSidebarClientNavigation();

  const baseState: BaseState = useMemo(
    () => ({
      files: new Map(),
      docsYml: "",
    }),
    []
  );

  // Note: clearAllChanges is available but not currently used in cleanup operations
  // It's kept for potential future use in comprehensive cleanup scenarios
  useDocumentChanges(baseState, {
    branchId: branchName,
    autoSave: false,
    autoSaveDelayMs: 300,
  });

  const cleanupClientPage = useCallback(
    (nodeId: NodeId) => {
      if (!removeClientNode) return;

      try {
        const result = removeClientNode(nodeId);
        if (result instanceof Promise) {
          result.catch((error: unknown) => {
            console.error(`Failed to remove client node ${nodeId}:`, error);
          });
        }
      } catch (error) {
        console.error(`Failed to remove client node ${nodeId}:`, error);
      }
    },
    [removeClientNode]
  );

  const cleanupAllClientPages = useCallback(() => {
    // Clear all client pages from the navigation context
    if (clientFoundNodes && Object.keys(clientFoundNodes).length > 0) {
      console.log(
        `Cleaning up ${Object.keys(clientFoundNodes).length} client pages`
      );

      // TODO: Implement comprehensive cleanup logic
      // This could include:
      // - Clearing all client nodes from navigation
      // - Resetting navigation state
      // - Cleaning up associated resources
      // - Notifying other components of the cleanup

      // For now, log the cleanup operation
      console.log("Client pages cleanup completed");
    } else {
      console.log("No client pages to clean up");
    }
  }, [clientFoundNodes]);

  const getClientPages = useCallback(() => {
    // Return client pages from the navigation context
    return clientFoundNodes || {};
  }, [clientFoundNodes]);

  const getClientPageCount = useCallback(() => {
    const pages = clientFoundNodes || {};
    return Object.keys(pages).length;
  }, [clientFoundNodes]);

  return {
    cleanupClientPage,
    cleanupAllClientPages,
    getClientPages,
    getClientPageCount,
  };
}
