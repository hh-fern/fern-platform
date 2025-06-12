"use client";

import { useQuery } from "@tanstack/react-query";

import { DashboardApiClient } from "@/app/services/dashboard-api/client";

import { convertQueryResultToLoadable } from "./convertQueryResultToLoadable";
import { ReactQueryKey } from "./queryKeys";

export function useCreateGithubBranch(
  repo: string,
  owner: string,
  baseBranch: string,
  newBranch: string
) {
  const queryKey = ReactQueryKey.createGithubBranch();

  return convertQueryResultToLoadable(
    useQuery({
      queryKey: queryKey,
      queryFn: () =>
        DashboardApiClient.createGithubBranch({
          repo,
          owner,
          baseBranch,
          newBranch,
        }),
    })
  );
}
