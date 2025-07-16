"use client";

import { useEffect } from "react";

import { usePostHog } from "posthog-js/react";

export declare namespace PostHogOrgNameUpdater {
  export interface Props {
    orgName: string;
  }
}

export function PostHogOrgNameUpdater({
  orgName,
}: PostHogOrgNameUpdater.Props) {
  const posthog = usePostHog();

  useEffect(() => {
    if (orgName) {
      posthog.setPersonProperties({
        orgName: orgName,
      });
    }
  }, [posthog, orgName]);

  return null;
}
