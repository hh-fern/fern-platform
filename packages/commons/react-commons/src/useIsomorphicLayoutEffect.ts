import React from "react";

export const useIsomorphicLayoutEffect: (
  effect: React.EffectCallback,
  deps?: React.DependencyList
) => void =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;
