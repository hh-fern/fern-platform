import { NextRequest, NextResponse } from "next/server";

import { getFaiClient } from "@/app/services/fai/getFaiClient";
import { getBaseDocsUrl } from "@/components/analytics/get-base-docs-url";
import {
  TimeRange,
  getRequestParams,
} from "@/components/analytics/get-request-params";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { docsUrl, timeRange } = await request.json();

  if (!docsUrl || !timeRange) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const client = getFaiClient({ token: "" });
  const baseDocsUrl = getBaseDocsUrl(docsUrl);

  const data = await client.analytics.getHistogramAnalytics(
    baseDocsUrl,
    getRequestParams(timeRange as TimeRange)
  );

  return NextResponse.json(data);
}
