/**
 * Track an event.
 *
 * @param event - The event name.
 * @param properties - The event properties.
 */
export function track(
  event: string,
  properties?: Record<string, unknown>
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent("fern-docs-track-analytics", {
      detail: { event, properties },
    })
  );
}
