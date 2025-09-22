"use client";

import type { Context, JSX, ReactNode } from "react";
import { createContext, useContext, useState } from "react";

type BranchContextValue = {
  branch: string;
  setBranch: (branch: string) => void;
  branchFailed: boolean;
};

export const BranchContext: Context<BranchContextValue> =
  createContext<BranchContextValue>({
    branch: "",
    setBranch: (_branch: string) => {
      return;
    },
    branchFailed: false,
  });

export function BranchProvider({
  branch,
  branchFailed,
  children,
}: {
  branch: string;
  branchFailed: boolean;
  children: ReactNode;
}): JSX.Element {
  const [currBranch, setBranchStore] = useState<string>(branch);

  function setBranch(branch: string) {
    setBranchStore(branch);
  }

  return (
    <BranchContext.Provider
      value={{ branch: currBranch, setBranch, branchFailed }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch(): BranchContextValue {
  return useContext(BranchContext);
}
