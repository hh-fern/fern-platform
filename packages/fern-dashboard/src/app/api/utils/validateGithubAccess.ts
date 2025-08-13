import { NextRequest, NextResponse } from "next/server";

import { validateApiGithubAccess, ApiGithubAccessValidationOptions } from "@/app/services/dal/github";

import { maybeGetCurrentSession } from "./maybeGetCurrentSession";

export async function validateGithubAccessForApi(
  req: NextRequest,
  options: Omit<ApiGithubAccessValidationOptions, "userId">
): Promise<{ success: true; userId: string } | { success: false; errorResponse: NextResponse }> {
  // Get current session
  const maybeSessionData = await maybeGetCurrentSession(req);
  if (maybeSessionData.errorResponse != null) {
    return { success: false, errorResponse: maybeSessionData.errorResponse };
  }

  // Validate GitHub access
  const errorResponse = await validateApiGithubAccess({
    ...options,
    userId: maybeSessionData.data.userId,
  });

  if (errorResponse) {
    return { success: false, errorResponse };
  }

  return { success: true, userId: maybeSessionData.data.userId };
}