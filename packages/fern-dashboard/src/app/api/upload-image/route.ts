import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { withZodValidation } from "@/app/services/dal/zod/middleware";

import { maybeGetCurrentSession } from "../utils/maybeGetCurrentSession";
import handler from "./handler";

export declare namespace uploadImage {
  export type Request = z.infer<typeof UploadImageRequest>;
  export type Response = z.infer<typeof UploadImageResponse>;
}

const UploadImageRequest = z.object({
  fileName: z.string(),
  contentType: z.string(),
  docsUrl: z.string(),
  // orgName: orgNameValidator,
  slug: z.string(),
});

const UploadImageResponse = z.object({
  uploadUrl: z.string(),
  imageUrl: z.string(),
  key: z.string(),
});

export const POST = withZodValidation(
  UploadImageRequest,
  async (
    req: NextRequest,
    validatedBody: z.infer<typeof UploadImageRequest>
  ) => {
    const maybeSessionData = await maybeGetCurrentSession(req);
    if (maybeSessionData.errorResponse != null) {
      return maybeSessionData.errorResponse;
    }

    // const ensureOrgOwnsUrlResponse = await ensureOrgOwnsUrl({
    //   url: validatedBody.docsUrl,
    //   orgName: validatedBody.orgName,
    //   token: maybeSessionData.data.token,
    // });
    // if (ensureOrgOwnsUrlResponse.errorResponse != null) {
    //   return ensureOrgOwnsUrlResponse.errorResponse;
    // }

    const { fileName, contentType, docsUrl, slug } = validatedBody;

    const result = await handler({
      fileName,
      contentType,
      docsUrl,
      slug,
    });
    const validatedResult = UploadImageResponse.parse(result.data);
    return NextResponse.json(validatedResult);
  }
);
