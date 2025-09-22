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

export declare namespace updatePrTitle {
  export type Request = z.infer<typeof UpdatePrTitleRequest>;
  export type Response = ResolvedReturnType<typeof handler>;
}

type UpdatePrTitleRequest = GithubIdentificationSchemeType & {
  orgName: Auth0OrgName;
  branch: string;
  title: string;
  baseBranch?: string;
};

type UpdatePrTitleRequestInput = GithubIdentificationSchemeType & {
  orgName: string;
  branch: string;
  title: string;
  baseBranch?: string;
};

export const UpdatePrTitleRequest: z.ZodType<
  UpdatePrTitleRequest,
  z.ZodTypeDef,
  UpdatePrTitleRequestInput
> = GithubIdentificationScheme.and(
  z.object({
    orgName: orgNameValidator,
    branch: z.string(),
    title: z.string(),
    baseBranch: z.string().optional(),
  })
);

export const POST: (req: NextRequest) => Promise<NextResponse> =
  withZodValidation(
    UpdatePrTitleRequest,
    async (
      req: NextRequest,
      validatedBody: z.infer<typeof UpdatePrTitleRequest>
    ) => {
      const { orgName, branch, title, baseBranch, ...repoData } = validatedBody;

      return withGithubAuthNextRoute(
        req,
        orgName,
        repoData,
        async ({ owner, repo }) => {
          const result = await handler({
            owner,
            repo,
            branch,
            title,
            baseBranch,
          });
          return NextResponse.json(result);
        }
      );
    }
  );
