"use client";

import React from "react";

import { composeEventHandlers } from "@radix-ui/primitive";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";

import { SearchModal } from "../components/search";
import { generateConversationId } from "../utils/generate-conversation-id";
import { Button } from "@fern-docs/components";
import { SearchIcon } from "lucide-react";

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
    <Button
      variant="default"
      aria-label="Open search"
      className="h-12 w-12 rounded-full bg-(color:--accent-a9)"
      {...props}
      onClick={composeEventHandlers(props.onClick, toggleSearchDialog)}
    >
      <SearchIcon size={12}/>
    </Button>
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
