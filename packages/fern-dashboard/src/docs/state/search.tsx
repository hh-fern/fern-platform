"use client";

import React from "react";

import { composeEventHandlers } from "@radix-ui/primitive";
import { type PrimitiveAtom, atom, useAtomValue, useSetAtom } from "jotai";
import { useHydrateAtoms } from "jotai/utils";

import { isLocal } from "@fern-api/docs-server/isLocal";
import { isSelfHosted } from "@fern-api/docs-server/isSelfHosted";
import { FERN_SEARCH_BUTTON_ID } from "@fern-docs/components/constants";
import { DesktopSearchButton } from "@fern-docs/search-ui/components/desktop/desktop-search-button";

export const searchDialogOpenAtom: PrimitiveAtom<boolean> =
  atom<boolean>(false);
export const searchInitializedAtom: PrimitiveAtom<boolean> =
  atom<boolean>(false);
export const isAskAiEnabledAtom: PrimitiveAtom<boolean> = atom<boolean>(false);

export const SetIsAskAiEnabled = ({
  isAskAiEnabled,
}: {
  isAskAiEnabled: boolean;
}) => {
  useHydrateAtoms([[isAskAiEnabledAtom, isAskAiEnabled]], {
    dangerouslyForceHydrate: true,
  });
  return null;
};

export const useIsAskAiEnabled = (): boolean => {
  return useAtomValue(isAskAiEnabledAtom);
};

export const isDefaultSearchFilterOnAtom: PrimitiveAtom<boolean> =
  atom<boolean>(false);

export const SetIsDefaultSearchFilterOn = ({
  isDefaultSearchFilterOn,
}: {
  isDefaultSearchFilterOn: boolean;
}) => {
  useHydrateAtoms([[isDefaultSearchFilterOnAtom, isDefaultSearchFilterOn]], {
    dangerouslyForceHydrate: true,
  });
  return null;
};

export const useIsDefaultSearchFilterOn = (): boolean => {
  return useAtomValue(isDefaultSearchFilterOnAtom);
};

searchInitializedAtom.onMount = (setInitialized: (value: boolean) => void) => {
  if (typeof window === "undefined") {
    return;
  }

  if (isLocal() || isSelfHosted()) {
    return;
  }

  const initialize = () => {
    setInitialized(true);
  };

  // enable other components to initialize the search state
  window.addEventListener("search:initialized", initialize);
  return () => {
    window.removeEventListener("search:initialized", initialize);
  };
};

export function SearchV2Trigger(
  props: React.ComponentProps<typeof DesktopSearchButton>
): React.JSX.Element {
  const isInitialized = useAtomValue(searchInitializedAtom);
  const toggleSearchDialog = useToggleSearchDialog();
  const isLocalEnvironment = isLocal();
  const placeholder = "Search";

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
}

export function useIsSearchDialogOpen(): boolean {
  return useAtomValue(searchDialogOpenAtom);
}

export function useToggleSearchDialog(): () => void {
  const setSearchDialogState = useSetAtom(searchDialogOpenAtom);
  return () => setSearchDialogState((prev) => !prev);
}
