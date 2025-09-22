"use client";

import { useQuery } from "@tanstack/react-query";

import type { Loadable } from "@fern-ui/loadable";

import type {
  Auth0OrgName,
  Auth0Organization,
} from "@/app/services/auth0/types";
import { DashboardApiClient } from "@/app/services/dashboard-api/client";
import { useOrgNameFromPathname } from "@/utils/useOrgNameFromPathname";

import { convertQueryResultToLoadable } from "./convertQueryResultToLoadable";
import type { inferQueryData } from "./queryKeys";
import { ReactQueryKey } from "./queryKeys";

const QUERY_KEY = ReactQueryKey.myOrganizations();

export function useOrganizations(): Loadable<Auth0Organization[]> {
  return convertQueryResultToLoadable(
    useQuery<inferQueryData<typeof QUERY_KEY>>({
      queryKey: QUERY_KEY,
      queryFn: () => DashboardApiClient.getMyOrganizations(),
    })
  );
}

export function useOrganization(
  orgName: Auth0OrgName
): Auth0Organization | undefined {
  const organizations = useOrganizations();
  if (organizations.type !== "loaded") {
    return undefined;
  }
  return organizations.value.find((org) => org.name === orgName);
}

export function useCurrentOrganization(): Auth0Organization | undefined {
  const orgName = useOrgNameFromPathname();
  return useOrganization(orgName);
}
