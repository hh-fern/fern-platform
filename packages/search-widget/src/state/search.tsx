"use client";

import React from "react";

import { composeEventHandlers } from "@radix-ui/primitive";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";

import { SearchModal } from "../components/search";
import { generateConversationId } from "../utils/generate-conversation-id";

export const searchDialogOpenAtom = atom(false);
export const searchInitializedAtom = atom(false);

export const conversationIdAtom = atom<string>(generateConversationId());
export function useConversationId() {
  const [conversationId, setConversationId] = useAtom(conversationIdAtom);
  return {
    conversationId,
    setConversationId,
    resetConversationId: () => setConversationId(generateConversationId()),
  };
}

export const SearchWidgetTrigger = React.memo(function SearchWidgetTrigger(
  props: React.ComponentProps<typeof SearchModal>
) {
  const toggleSearchDialog = useToggleSearchDialog();
  return (
    <button
      type="button"
      aria-label="Open search"
      className="ring-border-default ring-shadow-xl hover:ring-shadow-2xl bg:color(--accent) flex h-20 w-20 items-center justify-center rounded-full ring-1 ring-inset hover:cursor-pointer"
      {...props}
      onClick={composeEventHandlers(props.onClick, toggleSearchDialog)}
    >
      Open
    </button>
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
