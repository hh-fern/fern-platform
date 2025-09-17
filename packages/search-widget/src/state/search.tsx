"use client";

import React from "react";

import { composeEventHandlers } from "@radix-ui/primitive";
import { atom, useAtomValue, useSetAtom } from "jotai";

import { SearchButton } from "../components/search";

export const searchDialogOpenAtom = atom(false);
export const searchInitializedAtom = atom(true); 

export const SearchWidgetTrigger = React.memo(function SearchWidgetTrigger(
  props: React.ComponentProps<typeof SearchButton>
) {
  const toggleSearchDialog = useToggleSearchDialog();

  return (
    <SearchButton
      {...props}
      onClick={composeEventHandlers(props.onClick, toggleSearchDialog)}
    />
  );
});

export function useIsSearchDialogOpen(): boolean {
  return useAtomValue(searchDialogOpenAtom);
}

export function useToggleSearchDialog(): () => void {
  const setSearchDialogState = useSetAtom(searchDialogOpenAtom);
  return () => setSearchDialogState((prev) => !prev);
}

export function useSetSearchDialogOpen(): (open: boolean) => void {
  return useSetAtom(searchDialogOpenAtom);
}