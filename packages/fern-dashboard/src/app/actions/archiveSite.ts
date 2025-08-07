"use server";

import { FdrAPI } from "@fern-api/fdr-sdk";

import { DashboardError } from "@/utils/logging/errors";
import { FernLogger } from "@/utils/logging/logger";

import { getCurrentSessionOrThrow } from "../services/auth0/getCurrentSession";
import { getFdrClient } from "../services/fdr/getFdrClient";

export async function archiveSite({ url }: { url: string }) {
  const session = await getCurrentSessionOrThrow();
  const fdrClient = getFdrClient({ token: session.accessToken });
  const response = await fdrClient.docs.v2.write.setIsArchived({
    url: FdrAPI.Url(url),
    isArchived: true,
  });
  if (!response.ok) {
    FernLogger.error(DashboardError.FAILED_TO_ARCHIVE_SITE, response.error, {
      url,
    });
    throw new Error(DashboardError.FAILED_TO_ARCHIVE_SITE);
  }
}
