"use client";

import type { Context, ReactNode } from "react";
import { createContext, useContext, useState } from "react";

type CurrentPageContextValue = {
  currentFilename: string | null;
  setCurrentFilename: (filename: string) => void;
};

export const CurrentPageContext: Context<CurrentPageContextValue> =
  createContext<CurrentPageContextValue>({
    currentFilename: null,
    setCurrentFilename: () => {
      return;
    },
  });

export function CurrentPageProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const [currentFilename, setCurrentFilename] = useState<string | null>(null);

  return (
    <CurrentPageContext.Provider
      value={{ currentFilename, setCurrentFilename }}
    >
      {children}
    </CurrentPageContext.Provider>
  );
}

export function useCurrentPage(): CurrentPageContextValue {
  return useContext(CurrentPageContext);
}
