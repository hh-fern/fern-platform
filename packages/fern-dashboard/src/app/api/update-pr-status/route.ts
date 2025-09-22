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

export declare namespace updatePrStatus {
  export type Request = z.infer<typeof UpdatePrStatusRequest>;
  export type Response = ResolvedReturnType<typeof handler>;
}

type UpdatePrStatusRequest = GithubIdentificationSchemeType & {
  orgName: Auth0OrgName;
  branch: string;
  status: "open" | "draft";
  baseBranch?: string;
};

type UpdatePrStatusRequestInput = GithubIdentificationSchemeType & {
  orgName: string;
  branch: string;
  status: "open" | "draft";
  baseBranch?: string;
};

export const UpdatePrStatusRequest: z.ZodType<
  UpdatePrStatusRequest,
  z.ZodTypeDef,
  UpdatePrStatusRequestInput
> = GithubIdentificationScheme.and(
  z.object({
    orgName: orgNameValidator,
    branch: z.string(),
    status: z.enum(["open", "draft"]),
    baseBranch: z.string().optional(),
  })
);

export const POST: (req: NextRequest) => Promise<NextResponse> =
  withZodValidation(
    UpdatePrStatusRequest,
    async (
      req: NextRequest,
      validatedBody: z.infer<typeof UpdatePrStatusRequest>
    ) => {
      const { orgName, branch, status, baseBranch, ...repoData } =
        validatedBody;

      return withGithubAuthNextRoute(
        req,
        orgName,
        repoData,
        async ({ owner, repo }) => {
          const result = await handler({
            owner,
            repo,
            branch,
            status,
            baseBranch,
          });
          return NextResponse.json(result);
        }
      );
    }
  );
