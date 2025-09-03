import { createHash } from "crypto";

import { ClientPageStorage, PageStorage } from "@fern-docs/components";

import { Auth0UserID } from "@/app/services/auth0/types";

/**
 * Generate a short 6-character hash from an Auth0 sub
 * Note: the crypto library may not be availalbe on certain client browsers. Can use crypto.subtle if that is an issue.
 * @param sub - Auth0 sub, e.g. "github|002033e4"
 */
export function shortSubHash(sub: string): string {
  const [, idPart] = sub.split("|"); // grab part after |
  if (!idPart) throw new Error("Invalid sub format");

  // Use md5 hash since it's fast, we don't need to be secure here
  const hash = createHash("md5").update(idPart).digest("hex");
  return hash.substring(0, 6);
}

/**
 * Check if a branch name matches the expected format: YYYY-MM-DD-username-shortSubHash-randomHash
 * @param branchName - The branch name to check
 * @param expectedShortSubHash - The expected short sub hash for the user
 */
export function matchesBranchFormat(
  branchName: string,
  expectedShortSubHash: string
): boolean {
  const parts = branchName.split("-");

  // Should have at least 6 parts (date has 3 parts, plus username, shortSubHash, randomHash)
  if (parts.length < 6) {
    return false;
  }

  const shortSubHashIndex = parts.length - 2;
  return parts[shortSubHashIndex] === expectedShortSubHash;
}

/**
 * Gets relevant branches for a user by filtering stored branches from localStorage.
 * This function filters branches that:
 * 1. Exist in localStorage (indicating user has worked on them)
 * 2. Match the user's branch naming format (date-username-shortSubHash-randomHash)
 *
 * Merges branches from multiple storage sources:
 * - ClientPageStorage (client pages)
 * - PageStorage (regular pages)
 *
 * @param userId - Auth0 user ID (sub) for branch filtering
 * @returns Array of BranchInfo objects with branch names and unsaved changes status, sorted by relevance
 */
export function getRelevantBranches(userId: Auth0UserID): string[] {
  try {
    const userShortSubHash = shortSubHash(userId);

    const clientPageBranches = ClientPageStorage.getAllStoredBranches();
    const allPageBranches = PageStorage.getAllStoredBranches();

    const allStoredBranches = [
      ...new Set([...clientPageBranches, ...allPageBranches]),
    ];

    const userBranches = allStoredBranches.filter((branchName: string) =>
      matchesBranchFormat(branchName, userShortSubHash)
    );

    // Sort by date (newest first)
    const sortedBranches = userBranches.sort((a: string, b: string) => {
      // Extract the date part (first 10 characters: YYYY-MM-DD)
      const dateA = a.substring(0, 10);
      const dateB = b.substring(0, 10);

      if (dateA !== dateB) {
        return dateB.localeCompare(dateA);
      }

      return b.localeCompare(a);
    });

    return sortedBranches;
  } catch (error) {
    console.warn("Failed to get relevant branches from stored data:", error);
    return [];
  }
}

/**
 * Deletes all local storage data for a specific branch
 * This includes both regular pages and client pages
 * @param branchName - The branch name to delete from localStorage
 */
export function deleteLocalBranch(branchName: string): void {
  try {
    // Clear all regular pages for this branch
    PageStorage.clearAllPages(branchName);

    // Clear all client pages for this branch
    ClientPageStorage.clearAllClientPages(branchName);
  } catch (error) {
    console.error(
      `Failed to delete local storage data for branch ${branchName}:`,
      error
    );
  }
}
