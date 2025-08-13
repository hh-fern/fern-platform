import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { validateApiGithubAccess } from "@/app/services/dal/github";
import { ResolvedReturnType } from "@/utils/types";

import { maybeGetCurrentSession } from "../utils/maybeGetCurrentSession";
import { parseNextRequestBody } from "../utils/parseNextRequestBody";
import { orgNameValidator } from "../utils/validators";
import handler from "./handler";

export declare namespace postCreatePr {
  export type Request = z.infer<typeof PostCreatePrRequest>;
  export type Response = ResolvedReturnType<typeof handler>;
}

export const PostCreatePrRequest = z.object({
  owner: z.string(),
  repo: z.string(),
  head: z.string(),
  base: z.string(),
  title: z.string(),
  body: z.string().optional(),
  draft: z.boolean().optional(),
  orgName: orgNameValidator,
  githubUrl: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const maybeSessionData = await maybeGetCurrentSession(req);
  if (maybeSessionData.errorResponse != null) {
    return maybeSessionData.errorResponse;
  }
  const parsedBody = await parseNextRequestBody(req, PostCreatePrRequest);
  if (parsedBody.errorResponse != null) {
    return parsedBody.errorResponse;
  }
  const { owner, repo, head, base, title, body, draft, orgName, githubUrl } =
    parsedBody.data;

  const validationError = await validateApiGithubAccess({
    orgName,
    owner,
    repo,
    githubUrl,
    userId: maybeSessionData.data.userId,
  });
  if (validationError) {
    return validationError;
  }

  return NextResponse.json(
    await handler({
      owner,
      repo,
      head,
      base,
      title,
      body,
      draft,
    })
  );
}
