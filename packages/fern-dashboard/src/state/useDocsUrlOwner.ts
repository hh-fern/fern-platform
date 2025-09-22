import { useQuery } from "@tanstack/react-query";

import type { Loadable } from "@fern-ui/loadable";

import type { Auth0OrgName } from "@/app/services/auth0/types";
import { DashboardApiClient } from "@/app/services/dashboard-api/client";
import type { DocsUrl } from "@/utils/types";

import { convertQueryResultToLoadable } from "./convertQueryResultToLoadable";
import type { inferQueryData } from "./queryKeys";
import { ReactQueryKey } from "./queryKeys";

export function useDocsUrlOwner(docsUrl: DocsUrl): Loadable<{
  orgName: Auth0OrgName | undefined;
}> {
  const QUERY_KEY = ReactQueryKey.docsUrlOwner(docsUrl);

  return convertQueryResultToLoadable(
    useQuery<inferQueryData<typeof QUERY_KEY>>({
      queryKey: QUERY_KEY,
      queryFn: () => DashboardApiClient.getDocsUrlOwner({ url: docsUrl }),
    })
  );
}
