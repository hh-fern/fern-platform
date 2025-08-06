import { NextRequest, NextResponse } from "next/server";

import {
  decodeAccessToken,
  getCurrentSessionOrThrow,
} from "@/app/services/auth0/getCurrentSession";
import { Auth0UserID } from "@/app/services/auth0/types";
import { DashboardError } from "@/utils/logging/errors";
import { FernLogger } from "@/utils/logging/logger";

import { MaybeErrorResponse } from "./MaybeErrorResponse";
import { parseAuthHeader } from "./parseAuthHeader";

export interface ApiSessionData {
  token: string;
  userId: Auth0UserID;
}

export async function maybeGetCurrentSession(
  req: NextRequest
): Promise<MaybeErrorResponse<ApiSessionData>> {
  try {
    if (req.headers.get("authorization") != null) {
      const { token } = parseAuthHeader(req);
      const { userId } = decodeAccessToken(token);
      return { data: { token, userId } };
    }

    // I think auth0 uses cookies to get the current session?
    const sessionData = await getCurrentSessionOrThrow();
    return {
      data: {
        token: sessionData.accessToken,
        userId: sessionData.user.sub,
      },
    };
  } catch (e) {
    FernLogger.error(DashboardError.FAILED_TO_GET_SESSION_DATA, e, {
      url: req.url,
      method: req.method,
      hasAuthHeader: req.headers.get("authorization") != null,
    });
    return {
      errorResponse: NextResponse.json({}, { status: 401 }),
    };
  }
}
