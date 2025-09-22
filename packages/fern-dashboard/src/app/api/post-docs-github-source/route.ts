import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { z } from "zod";

import type { ResolvedReturnType } from "@/utils/types";

import { maybeGetCurrentSession } from "../utils/maybeGetCurrentSession";
import { parseNextRequestBody } from "../utils/parseNextRequestBody";
import handler from "./handler";

export declare namespace postDocsGithubSource {
  export type Request = z.infer<typeof PostDocsGithubSourceRequest>;
  export type Response = ResolvedReturnType<typeof handler>;
}

type PostDocsGithubSourceRequest = {
  url: string;
  githubUrl: string;
};

const PostDocsGithubSourceRequest: z.ZodType<PostDocsGithubSourceRequest> =
  z.object({
    url: z.string(),
    githubUrl: z.string(),
  });

export async function POST(req: NextRequest): Promise<NextResponse> {
  const maybeSessionData = await maybeGetCurrentSession(req);
  if (maybeSessionData.errorResponse != null) {
    return maybeSessionData.errorResponse;
  }
  const { token } = maybeSessionData.data;

  const parsedBody = await parseNextRequestBody(
    req,
    PostDocsGithubSourceRequest
  );
  if (parsedBody.errorResponse != null) {
    return parsedBody.errorResponse;
  }
  const { url, githubUrl } = parsedBody.data;

  await handler({ token, url, githubUrl });

  // Return empty response since handler returns void
  return NextResponse.json({});
}
