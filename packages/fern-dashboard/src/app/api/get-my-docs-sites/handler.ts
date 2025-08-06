import { FdrAPI } from "@fern-api/fdr-sdk";

import { Auth0OrgName } from "@/app/services/auth0/types";
import { getFdrClient } from "@/app/services/fdr/getFdrClient";
import { DashboardError } from "@/utils/logging/errors";
import { FernLogger } from "@/utils/logging/logger";

export default async function getMyDocsSites({
  orgName,
  token,
}: {
  orgName: Auth0OrgName;
  token: string;
}) {
  const fdr = getFdrClient({ token });
  const docsSites = await fdr.dashboard.getDocsSitesForOrg({
    // fdr uses org name (not id) as the org identifier
    orgId: FdrAPI.OrgId(orgName),
  });
  if (!docsSites.ok) {
    FernLogger.error(
      DashboardError.FAILED_TO_LOAD_DOCS_SITES,
      docsSites.error,
      {
        orgName,
      }
    );
    throw new Error("Failed to load docs sites");
  }

  return docsSites.body;
}
