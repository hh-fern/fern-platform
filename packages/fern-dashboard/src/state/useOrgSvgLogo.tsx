"use client";

import { useQuery } from "@tanstack/react-query";

import { FernLogger } from "@/utils/logging/logger";
import { DashboardError } from "@/utils/logging/errors";

import { convertQueryResultToLoadable } from "./convertQueryResultToLoadable";
import { ReactQueryKey } from "./queryKeys";

export function useOrgSvgLogo(svgUrl: string) {
  return convertQueryResultToLoadable(
    useQuery({
      queryKey: ReactQueryKey.orgSvgLogo(svgUrl),
      queryFn: async () => {
        const response = await fetch(svgUrl);
        const content = await response.text();
        if (!response.ok) {
          FernLogger.error(DashboardError.FAILED_TO_LOAD_LOGO, null, {
            hook: "useOrgSvgLogo",
            svgUrl,
            responseStatus: response.status,
            responseStatusText: response.statusText,
            content: content.slice(0, 200) + (content.length > 200 ? "..." : ""), // First 200 chars for debugging
          });
          throw new Error("Failed to load logo");
        }
        return content;
      },
    })
  );
}
