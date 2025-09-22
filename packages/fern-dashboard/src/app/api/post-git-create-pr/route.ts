import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { z } from "zod";

import { orgNameValidator } from "@/app/api/utils/validators";
import type { Auth0OrgName } from "@/app/services/auth0/types";
import { withGithubAuthNextRoute } from "@/app/services/dal/github/middleware";
import {
  GithubIdentificationScheme,
  type GithubIdentificationSchemeType,
} from "@/app/services/dal/github/types";
import { withZodValidation } from "@/app/services/dal/zod/middleware";
import type { ResolvedReturnType } from "@/utils/types";

import handler from "./handler";

export declare namespace postCreatePr {
  export type Request = z.infer<typeof PostCreatePrRequest>;
  export type Response = ResolvedReturnType<typeof handler>;
}

type PostCreatePrRequest = GithubIdentificationSchemeType & {
  orgName: Auth0OrgName;
  head: string;
  base: string;
  title: string;
  body?: string;
  draft?: boolean;
};

type PostCreatePrRequestInput = GithubIdentificationSchemeType & {
  orgName: string;
  head: string;
  base: string;
  title: string;
  body?: string;
  draft?: boolean;
};

export const PostCreatePrRequest: z.ZodType<
  PostCreatePrRequest,
  z.ZodTypeDef,
  PostCreatePrRequestInput
> = GithubIdentificationScheme.and(
  z.object({
    orgName: orgNameValidator,
    head: z.string(),
    base: z.string(),
    title: z.string(),
    body: z.string().optional(),
    draft: z.boolean().optional(),
  })
);

export const POST: (req: NextRequest) => Promise<NextResponse> =
  withZodValidation(
    PostCreatePrRequest,
    async (
      req: NextRequest,
      validatedBody: z.infer<typeof PostCreatePrRequest>
    ) => {
      const { orgName, head, base, title, body, draft, ...repoData } =
        validatedBody;

      return withGithubAuthNextRoute(
        req,
        orgName,
        repoData,
        async ({ owner, repo }) => {
          const result = await handler({
            owner,
            repo,
            head,
            base,
            title,
            body,
            draft,
          });
          return NextResponse.json(result);
        }
      );
    }
  );
