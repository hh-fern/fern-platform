"use client";

import { atom, useAtomValue, useSetAtom } from "jotai";
import { useHydrateAtoms } from "jotai/utils";

import { isLocal } from "@fern-api/docs-utils/component/isLocal";

export const searchDialogOpenAtom = atom(false);
export const searchInitializedAtom = atom(false);
export const isAskAiEnabledAtom = atom(false);
export const askAiAtom = atom(false);

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

export const useIsAskAiEnabled = () => {
  return useAtomValue(isAskAiEnabledAtom);
};

export const isDefaultSearchFilterOffAtom = atom(false);

export const SetIsDefaultSearchFilterOff = ({
  isDefaultSearchFilterOff,
}: {
  isDefaultSearchFilterOff: boolean;
}) => {
  useHydrateAtoms([[isDefaultSearchFilterOffAtom, isDefaultSearchFilterOff]], {
    dangerouslyForceHydrate: true,
  });
  return null;
};

export const useIsDefaultSearchFilterOff = () => {
  return useAtomValue(isDefaultSearchFilterOffAtom);
};

searchInitializedAtom.onMount = (setInitialized) => {
  if (typeof window === "undefined") {
    return;
  }

  if (isLocal()) {
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

export function useIsSearchDialogOpen(): boolean {
  return useAtomValue(searchDialogOpenAtom);
}

export function useToggleSearchDialog(): () => void {
  const setSearchDialogState = useSetAtom(searchDialogOpenAtom);
  return () => setSearchDialogState((prev) => !prev);
}
