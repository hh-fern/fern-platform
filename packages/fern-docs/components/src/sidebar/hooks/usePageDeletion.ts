"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback } from "react";

import * as FernNavigation from "@fern-api/fdr-sdk/navigation";

import { useSidebarClientNavigation } from "../nodes/SidebarClientNavigationProvider";
import { getPageFilename } from "../nodes/mdxUtils";
import {
  buildNavigationUrl,
  findNextNavigableItem,
} from "../utils/navigationUtils";

interface UsePageDeletionProps {
  root: FernNavigation.SidebarRootNode | undefined;
  stageDeletion?: (filename: string) => void;
}

export function usePageDeletion({ root, stageDeletion }: UsePageDeletionProps) {
  const params = useParams();
  const router = useRouter();
  const { clientNodes, removeClientNode } = useSidebarClientNavigation();

  const deleteClientPage = useCallback(
    (nodeId: FernNavigation.NodeId) => {
      if (!params) return;

      const orgName = params.orgName as string;
      const docsUrl = params.docsUrl as string;
      const branch = params.branch as string;

      // Find next item before deletion
      const nextItem = findNextNavigableItem(nodeId, root, clientNodes);

      // Remove from client navigation state
      removeClientNode?.(nodeId);

      // Navigate to next item if available
      if (nextItem) {
        // Check if next item is a client node
        const isClientNode = Object.values(clientNodes || {})
          .flat()
          .some((node) => node.id === nextItem.id);

        const navigationUrl = buildNavigationUrl(
          nextItem,
          orgName,
          docsUrl,
          branch,
          isClientNode
        );

        // Use router.push for navigation
        router.push(navigationUrl);
      } else {
        // No next item, navigate to root or docs home
        router.push(`/${orgName}/docs/${docsUrl}`);
      }
    },
    [params, router, root, clientNodes, removeClientNode]
  );

  const deleteServerPage = useCallback(
    (nodeId: FernNavigation.NodeId) => {
      if (!params || !stageDeletion) return;

      const orgName = params.orgName as string;
      const docsUrl = params.docsUrl as string;
      const branch = params.branch as string;

      // Find the node to get its filename
      const findNodeInTree = (
        children: FernNavigation.SidebarRootChild[],
        targetId: FernNavigation.NodeId
      ): FernNavigation.NavigationNodeWithMarkdown | null => {
        for (const child of children) {
          if (child.id === targetId && FernNavigation.hasMarkdown(child)) {
            return child;
          }
          if ("children" in child && child.children) {
            // Type guard to ensure children is an array of SidebarRootChild
            if (Array.isArray(child.children)) {
              const found = findNodeInTree(
                child.children as FernNavigation.SidebarRootChild[],
                targetId
              );
              if (found) return found;
            }
          }
        }
        return null;
      };

      const targetNode = root ? findNodeInTree(root.children, nodeId) : null;
      if (!targetNode) return;

      // Generate filename for the server page
      const filename = getPageFilename(targetNode.slug || "untitled");

      // Find next item before deletion
      const nextItem = findNextNavigableItem(nodeId, root, clientNodes);

      // Stage the deletion
      stageDeletion(filename);

      // Navigate to next item if available
      if (nextItem) {
        // Check if next item is a client node
        const isClientNode = Object.values(clientNodes || {})
          .flat()
          .some((node) => node.id === nextItem.id);

        const navigationUrl = buildNavigationUrl(
          nextItem,
          orgName,
          docsUrl,
          branch,
          isClientNode
        );

        router.push(navigationUrl);
      } else {
        // No next item, navigate to root or docs home
        router.push(`/${orgName}/docs/${docsUrl}`);
      }
    },
    [params, router, root, clientNodes, stageDeletion]
  );

  return {
    deleteClientPage,
    deleteServerPage,
  };
}
