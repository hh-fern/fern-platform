import { useQuery } from "@tanstack/react-query";

import type { FdrAPI } from "@fern-api/fdr-sdk/client/types";
import type { Loadable } from "@fern-ui/loadable";

import type { Theme } from "@/app/api/homepage-images/types";
import { DashboardApiClient } from "@/app/services/dashboard-api/client";
import { convertFdrDocsSiteUrlToDocsUrl } from "@/utils/getDocsSiteUrl";
import { useOrgNameFromPathname } from "@/utils/useOrgNameFromPathname";

import { convertQueryResultToLoadable } from "./convertQueryResultToLoadable";
import type { inferQueryData } from "./queryKeys";
import { ReactQueryKey } from "./queryKeys";

export function useHomepageImageUrl({
  docsSite,
  theme,
}: {
  docsSite: FdrAPI.dashboard.DocsSite;
  theme: Theme;
}): Loadable<{
  imageUrl: string;
}> {
  const orgName = useOrgNameFromPathname();
  const docsUrls = docsSite.urls.map(convertFdrDocsSiteUrlToDocsUrl);
  const QUERY_KEY = ReactQueryKey.homepageImageUrl({
    orgName,
    docsUrls,
    theme,
  });

  return convertQueryResultToLoadable(
    useQuery<inferQueryData<typeof QUERY_KEY>>({
      queryKey: QUERY_KEY,
      queryFn: () =>
        DashboardApiClient.getHomepageImages({
          orgName,
          urls: docsUrls,
          theme,
        }),
      retry: false,
    })
  );
}
