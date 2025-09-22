import { useMemo } from "react";

import { type SetStateAction, type WritableAtom, useAtom } from "jotai";
import type { RESET } from "jotai/utils";
import { atomWithDefault } from "jotai/utils";

import type { FacetFilter } from "@fern-docs/search-keyword";

export const filtersAtom: WritableAtom<
  readonly FacetFilter[],
  [typeof RESET | SetStateAction<readonly FacetFilter[]>],
  void
> = atomWithDefault<readonly FacetFilter[]>(() => []);

export type FiltersContext = {
  filtersAtom: typeof filtersAtom;
};

export interface FiltersManager<T = readonly FacetFilter[]> {
  filters: T;
  setFilters: React.Dispatch<React.SetStateAction<T>>;
}

export function createFiltersContext(): FiltersContext {
  return { filtersAtom };
}

export function useFilters(): FiltersManager {
  const [filters, setFilters] = useAtom(filtersAtom);
  return useMemo(() => {
    return {
      filters,
      setFilters,
    };
  }, [filters, setFilters]);
}
