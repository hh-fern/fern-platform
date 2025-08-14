"use client";

import { ReactNode, createContext, useContext } from "react";

import type * as FernNavigation from "@fern-api/fdr-sdk/navigation";

import { usePageDeletion } from "../hooks/usePageDeletion";

interface SidebarDeleteContextValue {
  deleteServerPage: (nodeId: FernNavigation.NodeId) => void;
  deleteClientPage: (nodeId: FernNavigation.NodeId) => void;
}

const SidebarDeleteContext = createContext<SidebarDeleteContextValue | null>(
  null
);

interface SidebarDeleteProviderProps {
  children: ReactNode;
  root: FernNavigation.SidebarRootNode | undefined;
  stageDeletion?: (filename: string) => void;
}

export function SidebarDeleteProvider({
  children,
  root,
  stageDeletion,
}: SidebarDeleteProviderProps) {
  const { deleteServerPage, deleteClientPage } = usePageDeletion({
    root,
    stageDeletion,
  });

  return (
    <SidebarDeleteContext.Provider
      value={{ deleteServerPage, deleteClientPage }}
    >
      {children}
    </SidebarDeleteContext.Provider>
  );
}

export function useSidebarDelete() {
  const context = useContext(SidebarDeleteContext);
  if (!context) {
    // Return no-op functions if provider is not available (e.g., in production docs)
    return {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      deleteServerPage: () => {},
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      deleteClientPage: () => {},
    };
  }
  return context;
}
