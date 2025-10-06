import { useEffect } from "react";

import { useCurrentPathname } from "@fern-docs/components/hooks/use-current-pathname";

import {
  capturePosthogEventCustomer,
  capturePosthogEventInternal,
} from "./posthog";

/**
 * Hook to track 404 errors with PostHog.
 * Call this hook in not-found pages to capture analytics when users hit a 404.
 *
 * @param eventName - Optional custom event name. Defaults to "not_found"
 */
export function useTrack404(eventName = "not_found"): void {
  const pathname = useCurrentPathname();

  useEffect(() => {
    // Capture the 404 event with the pathname that wasn't found
    const properties = {
      pathname,
      url: typeof window !== "undefined" ? window.location.href : undefined,
    };

    capturePosthogEventInternal(eventName, properties);
    capturePosthogEventCustomer(eventName, properties);
  }, [pathname, eventName]);
}
