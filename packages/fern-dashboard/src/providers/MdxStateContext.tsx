"use client";

import { ReactNode, createContext, useContext, useState } from "react";

type FilePath = string;
type Markdown = string;

export const MdxStateContext = createContext<{
  mdxState: Record<FilePath, Markdown>;
  setMdxState: (filePath: FilePath, markdown: Markdown) => void;
}>({
  mdxState: {},
  setMdxState: (_filePath: FilePath, _markdown: Markdown) => {
    return;
  },
});

export function MdxStateProvider({ children }: { children: ReactNode }) {
  const [mdxState, setMdxStateStore] = useState<Record<FilePath, Markdown>>({});

  function setMdxState(filePath: FilePath, markdown: Markdown) {
    setMdxStateStore((prev) => ({ ...prev, [filePath]: markdown }));
  }

  return (
    <MdxStateContext.Provider value={{ mdxState, setMdxState }}>
      {children}
    </MdxStateContext.Provider>
  );
}

export function useMdxState() {
  return useContext(MdxStateContext);
}
