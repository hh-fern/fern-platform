import { NextRequest, NextResponse } from "next/server";

import { ZodType, z } from "zod";

import { DashboardError } from "@/utils/logging/errors";
import { FernLogger } from "@/utils/logging/logger";

import { MaybeErrorResponse } from "./MaybeErrorResponse";

export async function parseNextRequestBody<T extends ZodType>(
  req: NextRequest,
  schema: T
): Promise<MaybeErrorResponse<z.infer<T>>> {
  let requestJson: unknown;
  try {
    requestJson = await req.json();
  } catch (e) {
    FernLogger.error(DashboardError.FAILED_TO_DESERIALIZE_REQUEST_BODY, e, {
      url: req.url,
      method: req.method,
    });
    return {
      errorResponse: NextResponse.json(
        { message: "Request is not JSON" },
        { status: 422 }
      ),
    };
  }

  return safeParseJson(requestJson, schema);
}

export function safeParseJson<T>(
  requestJson: unknown,
  schema: ZodType<T>
): MaybeErrorResponse<T> {
  const request = schema.safeParse(requestJson);
  if (!request.success) {
    FernLogger.error(
      DashboardError.FAILED_TO_VALIDATE_REQUEST_BODY,
      request.error,
      {
        requestJson: JSON.stringify(requestJson),
      }
    );
    return {
      errorResponse: NextResponse.json(
        { message: "Failed to parse request", error: request.error },
        { status: 422 }
      ),
    };
  }

  return { data: request.data };
}
