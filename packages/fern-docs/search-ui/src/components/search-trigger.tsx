import { useAtomValue } from "jotai";

import { searchInitializedAtom, useIsAskAiEnabled, useToggleSearchDialog } from "@fern-docs/components/state/search";

import { DesktopSearchButton } from "./desktop/desktop-search-button";
import { useIsMobile } from "@fern-ui/react-commons";
import { isLocal } from "@fern-api/docs-server";
import React from "react";
import { composeEventHandlers } from "@radix-ui/primitive";
import { FERN_SEARCH_BUTTON_ID } from "@fern-docs/components/constants";

export const SearchV2Trigger = React.memo(function SearchV2Trigger(
  props: React.ComponentProps<typeof DesktopSearchButton>
) {
  const isInitialized = useAtomValue(searchInitializedAtom);
  const toggleSearchDialog = useToggleSearchDialog();
  const isAskAiEnabled = useIsAskAiEnabled();
  const isMobile = useIsMobile();
  const isLocalEnvironment = isLocal();
  let placeholder = "Search";

  if (isAskAiEnabled && !isMobile) {
    placeholder = props.isSearchInSidebar
      ? "Search or ask AI"
      : "Search or ask AI a question";
  }

  return (
    <DesktopSearchButton
      /**
       * IMPORTANT: This component must be rendered only ONCE in the entire DOM tree,
       * because the ID must be unique across the entire document.
       */
      id={FERN_SEARCH_BUTTON_ID}
      {...props}
      onClick={composeEventHandlers(props.onClick, toggleSearchDialog)}
      variant={isInitialized && !isLocalEnvironment ? "default" : "loading"}
      placeholder={placeholder}
    />
  );
});
