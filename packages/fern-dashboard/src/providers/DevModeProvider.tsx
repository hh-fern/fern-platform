"use client";

import type { Context, ReactNode } from "react";
import { createContext, useContext, useState } from "react";

type DevModeContextValue = {
  panelOpen: boolean;
  setPanelOpen: (panelOpen: boolean) => void;
};

export const DevModeContext: Context<DevModeContextValue> =
  createContext<DevModeContextValue>({
    panelOpen: false,
    setPanelOpen: (_panelOpen: boolean) => {
      return;
    },
  });

export function DevModeProvider({
  children,
}: {
  children: ReactNode;
}): React.JSX.Element {
  const [panelOpen, setPanelOpenStore] = useState<boolean>(false);

  function setPanelOpen(panelOpen: boolean) {
    setPanelOpenStore(panelOpen);
  }

  return (
    <DevModeContext.Provider value={{ panelOpen, setPanelOpen }}>
      {children}
    </DevModeContext.Provider>
  );
}

export function useDevMode(): DevModeContextValue {
  return useContext(DevModeContext);
}
