import { useSearchBox as useAlgoliaSearchBox } from "react-instantsearch";

// Client-safe version - always use Algolia (no server-side isSelfHosted check)
export function useSearchBox(): ReturnType<typeof useAlgoliaSearchBox> {
  return useAlgoliaSearchBox();
}