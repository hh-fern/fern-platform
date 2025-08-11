import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { ResolvedReturnType } from "@/utils/types";

import { parseNextRequestBody } from "../utils/parseNextRequestBody";
import handler from "./handler";
import { maybeGetCurrentSession } from "../utils/maybeGetCurrentSession";

export declare namespace generatePrDescription {
  export type Request = z.infer<typeof GeneratePrDescriptionRequest>;
  export type Response = ResolvedReturnType<typeof handler>;
}

export const GeneratePrDescriptionRequest = z.object({
  owner: z.string(),
  repo: z.string(),
  branch: z.string(),
  baseBranch: z.string().optional(),
});

export async function POST(req: NextRequest) {
  // TODO: can we remove this now
  const maybeSessionData = await maybeGetCurrentSession(req);
  if (maybeSessionData.errorResponse != null) {
    return maybeSessionData.errorResponse;
  }
  const parsedBody = await parseNextRequestBody(
    req,
    GeneratePrDescriptionRequest
  );
  if (parsedBody.errorResponse != null) {
    return parsedBody.errorResponse;
  }
  const { owner, repo, branch, baseBranch } = parsedBody.data;

  return NextResponse.json(
    await handler({ owner, repo, branch, baseBranch })
  );
}
