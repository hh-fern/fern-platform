/**
 * Utility functions to manage uncommitted changes state in localStorage
 * This allows components to track and share the state of uncommitted changes
 * across different parts of the application.
 */

const UNCOMMITTED_CHANGES_KEY_PREFIX = "hasUncommittedChanges";

/**
 * Sets the uncommitted changes state for a specific branch
 * @param branch - The branch name
 * @param hasUncommittedChanges - Whether there are uncommitted changes
 */
export function setUncommittedChangesState(
  branch: string,
  hasUncommittedChanges: boolean
): void {
  if (!branch) return;

  const key = `${UNCOMMITTED_CHANGES_KEY_PREFIX}-${branch}`;
  if (hasUncommittedChanges) {
    localStorage.setItem(key, "true");
  } else {
    localStorage.removeItem(key);
  }
}

/**
 * Gets the uncommitted changes state for a specific branch
 * @param branch - The branch name
 * @returns Whether there are uncommitted changes
 */
export function getUncommittedChangesState(branch: string): boolean {
  if (!branch) return false;

  const key = `${UNCOMMITTED_CHANGES_KEY_PREFIX}-${branch}`;
  return localStorage.getItem(key) === "true";
}

/**
 * Clears the uncommitted changes state for a specific branch
 * @param branch - The branch name
 */
export function clearUncommittedChangesState(branch: string): void {
  if (!branch) return;

  const key = `${UNCOMMITTED_CHANGES_KEY_PREFIX}-${branch}`;
  localStorage.removeItem(key);
}
