import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { ResolvedReturnType } from "@/utils/types";

import { maybeGetCurrentSession } from "../utils/maybeGetCurrentSession";
import { parseNextRequestBody } from "../utils/parseNextRequestBody";
import handler from "./handler";

export declare namespace createGithubBranch {
  export type Request = z.infer<typeof CreateGithubBranchRequest>;
  export type Response = ResolvedReturnType<typeof handler>;
}

export const CreateGithubBranchRequest = z.object({
  repo: z.string(),
  owner: z.string(),
  baseBranch: z.string(),
  newBranch: z.string(),
});

export async function POST(req: NextRequest) {
  const maybeSessionData = await maybeGetCurrentSession(req);
  if (maybeSessionData.errorResponse != null) {
    return maybeSessionData.errorResponse;
  }
  const { userId } = maybeSessionData.data;

  const parsedBody = await parseNextRequestBody(req, CreateGithubBranchRequest);
  if (parsedBody.errorResponse != null) {
    return parsedBody.errorResponse;
  }
  const { repo, owner, baseBranch, newBranch } = parsedBody.data;

  return NextResponse.json(
    await handler(userId, owner, repo, baseBranch, newBranch)
  );
}
