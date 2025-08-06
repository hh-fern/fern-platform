import { OrgEdgeFlags } from "@fern-api/docs-utils";
import { getEdgeFlagsForOrg } from "@fern-docs/edge-config";
import { FernLogger } from "@/utils/logging/logger";
import { DashboardError } from "@/utils/logging/errors";

export async function checkOrgHasFlag(
  orgName: string,
  flagKey: keyof OrgEdgeFlags
): Promise<boolean> {
  try {
    const flagConfig = await getEdgeFlagsForOrg(orgName);
    if (!flagConfig) {
      return false;
    }
    return flagConfig[flagKey] ?? false;
  } catch (error) {
    FernLogger.error(
      DashboardError.FAILED_TO_CHECK_ORG_FLAG,
      error,
      {
        orgName,
        flagKey,
      }
    );
    return false;
  }
}
