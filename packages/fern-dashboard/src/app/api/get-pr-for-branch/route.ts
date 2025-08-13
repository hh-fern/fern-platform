import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { validateGithubAccess } from "@/app/services/dal/github";
import { ResolvedReturnType } from "@/utils/types";

import { maybeGetCurrentSession } from "../utils/maybeGetCurrentSession";
import { parseNextRequestBody } from "../utils/parseNextRequestBody";
import { orgNameValidator } from "../utils/validators";
import handler from "./handler";

export declare namespace getPrForBranch {
  export type Request = z.infer<typeof GetPrForBranchRequest>;
  export type Response = ResolvedReturnType<typeof handler>;
}

export const GetPrForBranchRequest = z.object({
  owner: z.string(),
  repo: z.string(),
  githubUrl: z.string().optional(),
  branch: z.string(),
  orgName: orgNameValidator,
  baseBranch: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const maybeSessionData = await maybeGetCurrentSession(req);
  if (maybeSessionData.errorResponse != null) {
    return maybeSessionData.errorResponse;
  }

  const parsedBody = await parseNextRequestBody(req, GetPrForBranchRequest);
  if (parsedBody.errorResponse != null) {
    return parsedBody.errorResponse;
  }
  const { owner, repo, branch, baseBranch, orgName, githubUrl } =
    parsedBody.data;

  await validateGithubAccess({
    orgName,
    owner,
    repo,
    githubUrl,
    userId: maybeSessionData.data.userId,
  });

  return NextResponse.json(
    await handler({
      owner,
      repo,
      branch,
      baseBranch,
    })
  );
}
