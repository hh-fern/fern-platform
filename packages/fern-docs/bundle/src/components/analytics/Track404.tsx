"use client";

import { useTrack404 } from "./use-track-404";

/**
 * Client component wrapper for tracking 404 errors.
 * This component can be used in server components to enable 404 tracking.
 */
export function Track404() {
  useTrack404();
  return null;
}
