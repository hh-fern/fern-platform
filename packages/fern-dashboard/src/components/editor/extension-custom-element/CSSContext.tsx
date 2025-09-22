import type { ReactNode } from "react";
import React, { createContext, useContext } from "react";

interface CSSConfig {
  inline?: string[];
}

const CSSContext = createContext<CSSConfig | undefined>(undefined);

export const CSSProvider = ({
  children,
  cssConfig,
}: {
  children: ReactNode;
  cssConfig?: CSSConfig;
}): JSX.Element => {
  return (
    <CSSContext.Provider value={cssConfig}>{children}</CSSContext.Provider>
  );
};

export const useCSS = (): CSSConfig => {
  const context = useContext(CSSContext);
  if (context === undefined) {
    return { inline: [] };
  }
  return context;
};
