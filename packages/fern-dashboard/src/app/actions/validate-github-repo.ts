"use server";

import { revalidateTag } from "next/cache";

import { validateGithubRepoAccess } from "@/app/services/dal/github/validators";

export async function validateGithubRepoAction(
  orgName: string,
  githubUrl: string
) {
  const result = await validateGithubRepoAccess(
    orgName,
    { type: "url", githubUrl },
    true // Always skip cache for polling
  );
  if (result.ok) {
    // Revalidate any cached data for this repo
    revalidateTag(`github-repo-${orgName}-${githubUrl}`);
  }

  return result;
}
