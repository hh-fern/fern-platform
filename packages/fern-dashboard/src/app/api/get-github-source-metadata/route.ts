import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { validateApiGithubAccess } from "@/app/services/dal/github";
import { ResolvedReturnType } from "@/utils/types";

import { maybeGetCurrentSession } from "../utils/maybeGetCurrentSession";
import { parseNextRequestBody } from "../utils/parseNextRequestBody";
import { orgNameValidator } from "../utils/validators";
import handler from "./handler";

export declare namespace getGithubSourceMetadata {
  export type Request = z.infer<typeof GetGithubSourceMetadataRequest>;
  export type Response = ResolvedReturnType<typeof handler>;
}

const GetGithubSourceMetadataRequest = z.object({
  skipCache: z.boolean().optional(),
  githubUrl: z.string(),
  orgName: orgNameValidator.optional(),
  owner: z.string().optional(),
  repo: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const maybeSessionData = await maybeGetCurrentSession(req);
  if (maybeSessionData.errorResponse != null) {
    return maybeSessionData.errorResponse;
  }
  const { userId } = maybeSessionData.data;

  const parsedBody = await parseNextRequestBody(
    req,
    GetGithubSourceMetadataRequest
  );
  if (parsedBody.errorResponse != null) {
    return parsedBody.errorResponse;
  }
  const { githubUrl, skipCache, orgName, owner, repo } = parsedBody.data;

  // Validate GitHub access if we have the required context
  if (orgName) {
    const validationError = await validateApiGithubAccess({
      orgName,
      owner,
      repo,
      githubUrl,
      userId,
    });
    if (validationError) {
      return validationError;
    }
  }

  const response = await handler({ userId, githubUrl, skipCache });

  return NextResponse.json(response);
}
