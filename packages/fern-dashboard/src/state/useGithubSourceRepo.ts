"use client";

import { useQuery } from "@tanstack/react-query";

import { DashboardApiClient } from "@/app/services/dashboard-api/client";

import { convertQueryResultToLoadable } from "./convertQueryResultToLoadable";
import { ReactQueryKey } from "./queryKeys";

export function useGithubSourceRepo(githubUrl?: string) {
  const queryKey = ReactQueryKey.githubSourceRepo(githubUrl ?? "no-github-url");

  return convertQueryResultToLoadable(
    useQuery({
      queryKey: queryKey,
      queryFn: () =>
        githubUrl
          ? DashboardApiClient.getGithubSourceMetadata({
              githubUrl,
              skipCache: true,
            })
          : undefined,
    })
  );
}
