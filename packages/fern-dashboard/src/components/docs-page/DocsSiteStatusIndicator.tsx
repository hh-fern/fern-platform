"use client";

import { useMemo } from "react";

import { getLoadableValue } from "@fern-ui/loadable";

import { useDomainStatus } from "@/state/useDomainStatus";
import { useDocsSite } from "@/state/useMyDocsSites";
import { DocsUrl } from "@/utils/types";
import { useOrgNameFromPathname } from "@/utils/useOrgNameFromPathname";

interface DocsSiteStatusIndicatorProps {
  docsUrl: DocsUrl;
}

export function DocsSiteStatusIndicator({
  docsUrl,
}: DocsSiteStatusIndicatorProps) {
  const docsSite = getLoadableValue(useDocsSite(docsUrl));
  const { getOverallStatus } = useDomainStatus();
  const orgName = useOrgNameFromPathname();

  // TEMPORARY: Only enable for plantman org during testing
  const isDomainSetupEnabled = orgName === "plantman";

  const { statusText, statusColor, dotColor, bgColor } = useMemo(() => {
    if (!docsSite?.urls) {
      return {
        statusText: "Loading...",
        statusColor: "text-gray-600",
        dotColor: "bg-gray-400",
        bgColor: "bg-gray-100",
      };
    }

    // For non-enabled orgs, always show "Live" (original behavior)
    if (!isDomainSetupEnabled) {
      return {
        statusText: "Live",
        statusColor: "text-green-1100",
        dotColor: "bg-green-1100",
        bgColor: "bg-green-300",
      };
    }

    const domains = docsSite.urls.map((url) => url.domain);
    const overallStatus = getOverallStatus(domains);

    switch (overallStatus) {
      case "live":
        return {
          statusText: "Live",
          statusColor: "text-green-1100",
          dotColor: "bg-green-1100",
          bgColor: "bg-green-300",
        };
      case "verifying":
        return {
          statusText: "Verifying...",
          statusColor: "text-blue-700",
          dotColor: "bg-blue-500 animate-slow-pulse",
          bgColor: "bg-blue-100",
        };
      case "pending":
        return {
          statusText: "Pending",
          statusColor: "text-yellow-900 dark:text-yellow-1100",
          dotColor: "bg-yellow-600 dark:bg-yellow-500",
          bgColor: "bg-yellow-200 dark:bg-yellow-400",
        };
      case "error":
        return {
          statusText: "Error",
          statusColor: "text-red-700",
          dotColor: "bg-red-500",
          bgColor: "bg-red-100",
        };
      default:
        return {
          statusText: "Unknown",
          statusColor: "text-gray-600",
          dotColor: "bg-gray-400",
          bgColor: "bg-gray-100",
        };
    }
  }, [docsSite, getOverallStatus, isDomainSetupEnabled]);

  return (
    <div
      className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-2 ${bgColor}`}
    >
      <div className={`size-2 rounded-full ${dotColor}`} />
      <div className={`mb-0.5 text-sm leading-none ${statusColor}`}>
        {statusText}
      </div>
    </div>
  );
}
