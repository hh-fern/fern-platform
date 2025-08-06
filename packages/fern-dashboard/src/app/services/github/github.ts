import { DashboardError } from "@/utils/logging/errors";
import { FernLogger } from "@/utils/logging/logger";

import { Auth0OrgName } from "../auth0/types";
import { DashboardApiClient } from "../dashboard-api/client";

export async function handleCreatePr({
  orgName,
  branch,
  owner,
  repo,
  baseBranch,
}: {
  orgName: Auth0OrgName;
  branch: string;
  owner: string;
  repo: string;
  baseBranch: string;
}): Promise<string | undefined> {
  try {
    const response = await DashboardApiClient.postCreatePr({
      orgName,
      owner,
      repo,
      head: branch,
      base: baseBranch,
      title: "Visual Editor: Update",
    });
    if (response.success) {
      try {
        // No need to await this, we just want to try to generate a PR description.
        void handleGeneratePrDescription({
          orgName,
          branch,
          owner,
          repo,
          baseBranch,
        });
      } catch (error) {
        // Silently fail if we can't generate a PR description.
        FernLogger.error(
          DashboardError.FAILED_TO_GENERATE_PR_DESCRIPTION,
          error,
          {
            orgName,
            branch,
            owner,
            repo,
            baseBranch,
          }
        );
      }
      return response.prUrl;
    } else {
      FernLogger.error(DashboardError.FAILED_TO_CREATE_PR, response.error, {
        orgName,
        owner,
        repo,
        branch,
        baseBranch,
      });
    }
  } catch (error) {
    FernLogger.error(DashboardError.FAILED_TO_CREATE_PR, error, {
      orgName,
      owner,
      repo,
      branch,
      baseBranch,
    });
  }
  return undefined;
}

export async function handleGeneratePrDescription({
  orgName,
  branch,
  owner,
  repo,
  baseBranch,
}: {
  orgName: Auth0OrgName;
  branch: string;
  owner: string;
  repo: string;
  baseBranch: string;
}) {
  await DashboardApiClient.generatePrDescription({
    orgName,
    owner,
    repo,
    branch,
    baseBranch,
  });
}
