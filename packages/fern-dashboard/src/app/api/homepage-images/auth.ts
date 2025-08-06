import { NextResponse } from "next/server";

import { FernVenusApi } from "@fern-api/venus-api-sdk";

import { Auth0OrgName } from "@/app/services/auth0/types";
import { getVenusClient } from "@/app/services/venus/getVenusClient";
import { DashboardError } from "@/utils/logging/errors";
import { FernLogger } from "@/utils/logging/logger";

import { MaybeErrorResponse } from "../utils/MaybeErrorResponse";
import { getDocsUrlOwner } from "../utils/getDocsUrlMetadata";

export async function ensureUserOwnsUrl({
  token,
  url,
}: {
  token: string;
  url: string;
}): Promise<MaybeErrorResponse> {
  const owner = await getDocsUrlOwner({ url, token });

  const isMember = await getVenusClient({ token }).organization.isMember(
    FernVenusApi.OrganizationId(owner.orgName)
  );
  if (!isMember.ok) {
    FernLogger.error(
      DashboardError.DASHBOARD_API_REQUEST_FAILED,
      isMember.error,
      {
        url,
        orgName: owner.orgName,
      }
    );
    throw new Error("Failed to load org membership for user");
  }
  if (!isMember.body) {
    return {
      errorResponse: NextResponse.json(
        { error: "User does not have access to url" },
        { status: 403 }
      ),
    };
  }

  return { data: undefined };
}

export async function ensureOrgOwnsUrl({
  token,
  url,
  orgName,
}: {
  token: string;
  url: string;
  orgName: Auth0OrgName;
}): Promise<MaybeErrorResponse> {
  const owner = await getDocsUrlOwner({ url, token });

  if (owner.orgName !== orgName) {
    FernLogger.error(DashboardError.DASHBOARD_API_REQUEST_FAILED, null, {
      url,
      orgName,
      actualOwner: owner.orgName,
    });
    return {
      errorResponse: NextResponse.json(
        { message: `Org ${orgName} does not own URL ${url}` },
        { status: 401 }
      ),
    };
  }
  return { data: undefined };
}
