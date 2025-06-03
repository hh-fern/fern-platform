"use client";

import { useEffect, useState } from "react";

import { atom, useAtomValue } from "jotai";

import { FernDocs } from "@fern-api/fdr-sdk";

export const isSidebarFixedAtom = atom<boolean>(false);
export const isLandingPageAtom = atom<boolean>(false);
export const emptySidebarAtom = atom<boolean>(false);
export const emptyTableOfContentsAtom = atom<boolean>(false);
export const layoutAtom = atom<FernDocs.Layout>("guide");

export function useIsSidebarFixed() {
  return useAtomValue(isSidebarFixedAtom);
}

export function useLayout() {
  return useAtomValue(layoutAtom);
}

export function useShouldHideAsides() {
  const isSidebarFixed = useAtomValue(isSidebarFixedAtom);
  const layout = useAtomValue(layoutAtom);
  const emptySidebar = useAtomValue(emptySidebarAtom);
  const isLandingPage = useAtomValue(isLandingPageAtom);
  const tocIsEmpty = useAtomValue(emptyTableOfContentsAtom);

  // only guides and overviews currently have table of contents
  const emptyTableOfContents =
    tocIsEmpty || (layout !== "guide" && layout !== "overview");

  // page layout should supersede a fixed sidebar
  if (layout === "custom" || layout === "page" || isLandingPage) {
    return true;
  }

  if (isSidebarFixed) {
    return false;
  }

  return emptySidebar && emptyTableOfContents;
}

export function HideAsides({ force }: { force?: boolean }) {
  const [isMounted, setIsMounted] = useState(false);
  const hideAsides = useShouldHideAsides();
  useEffect(() => {
    setIsMounted(true);
  }, []);
  if (!isMounted) {
    return null;
  }
  if (!hideAsides && !force) {
    return null;
  }
  return (
    <style jsx global>{`
      #fern-toc,
      #fern-sidebar[data-state="sticky"],
      #fern-sidebar[data-state="fixed"],
      #fern-sidebar-spacer {
        visibility: hidden;
        width: 0;
        overflow: hidden;
        display: none;
      }
    `}</style>
  );
}
