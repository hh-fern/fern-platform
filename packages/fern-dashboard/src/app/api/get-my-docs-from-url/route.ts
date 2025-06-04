import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { ResolvedReturnType } from "@/utils/types";

import { maybeGetCurrentSession } from "../utils/maybeGetCurrentSession";
import { parseNextRequestBody } from "../utils/parseNextRequestBody";
import handler from "./handler";

export declare namespace getDocsFromUrl {
  export type Request = z.infer<typeof GetDocsFromUrlRequest>;
  export type Response = ResolvedReturnType<typeof handler>;
}

export const GetDocsFromUrlRequest = z.object({
  url: z.string(),
});

export async function POST(req: NextRequest) {
  const maybeSessionData = await maybeGetCurrentSession(req);
  if (maybeSessionData.errorResponse != null) {
    return maybeSessionData.errorResponse;
  }
  const { token } = maybeSessionData.data;

  const parsedBody = await parseNextRequestBody(req, GetDocsFromUrlRequest);
  if (parsedBody.errorResponse != null) {
    return parsedBody.errorResponse;
  }
  const { url } = parsedBody.data;

  return NextResponse.json(await handler({ url, token }));
}
