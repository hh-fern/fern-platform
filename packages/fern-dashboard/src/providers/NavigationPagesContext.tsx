"use client";

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";

import { FernNavigation } from "@fern-api/fdr-sdk";

import { addNavigationNode } from "@/app/actions/addNavigationNode";
import { DocsUrl } from "@/utils/types";

export const PagesContext = createContext<{
  addedPages: FernNavigation.PageNode[];
  addNewPage: (metadata: { title: string; slug: string }) => void; // note: to begin, we will only add pages to the sidebar
}>({
  addedPages: [],
  addNewPage: () => undefined,
});

export function PagesProvider({
  docsUrl,
  children,
}: {
  docsUrl: DocsUrl;
  children: ReactNode;
}) {
  const [addedPages, setAddedPages] = useState<FernNavigation.PageNode[]>([]);

  const addNewPage = useCallback(
    (metadata: { title: string; slug: string }) => {
      setAddedPages((prev) => [...prev, node]);
      addNavigationNode(docsUrl, node).then(() => {
        console.log("added navigation node", node);
      });
    },
    [docsUrl, setAddedPages]
  );

  return (
    <PagesContext.Provider
      value={{
        addedPages,
        addNewPage,
      }}
    >
      {children}
    </PagesContext.Provider>
  );
}

export function usePages() {
  return useContext(PagesContext);
}
