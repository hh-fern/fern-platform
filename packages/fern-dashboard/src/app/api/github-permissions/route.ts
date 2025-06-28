import { NextRequest, NextResponse } from "next/server";

import { ResolvedReturnType } from "@/utils/types";

import { maybeGetCurrentSession } from "../utils/maybeGetCurrentSession";
import handler from "./handler";

export declare namespace getGitHubPermissions {
  export type Response = ResolvedReturnType<typeof handler>;
}

import { z } from "zod";

const RequestBodySchema = z.object({
  auth0Token: z.string(),
  githubRepoUrl: z.string().url(),
});

export async function GET(req: NextRequest) {
  const maybeSessionData = await maybeGetCurrentSession(req);
  if (maybeSessionData.errorResponse != null) {
    return maybeSessionData.errorResponse;
  }
  const { userId } = maybeSessionData.data;

  const body = await req.json();
  const parsedBody = RequestBodySchema.parse(body);

  return NextResponse.json(await handler({
    auth0Token: parsedBody.auth0Token,
    auth0UserId: userId,
    githubRepoUrl: parsedBody.githubRepoUrl
  }));
}
