import { NextRequest, NextResponse } from "next/server";

import { withSecureCookie } from "@fern-api/docs-server/auth/with-secure-cookie";
import { safeUrl } from "@fern-api/docs-server/safeUrl";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");
    const payload = searchParams.get("payload");
    const redirect = searchParams.get("redirect");

    if (!name || !payload) {
      return NextResponse.json(
        { error: "Missing required query parameters: name and payload" },
        { status: 400 }
      );
    }

    let response: NextResponse = NextResponse.json({ success: true });

    if (redirect) {
      const redirectUrl = safeUrl(redirect);
      if (redirectUrl) {
        response = NextResponse.redirect(redirectUrl.toString());
      }
    }

    response.cookies.set(
      name,
      payload,
      withSecureCookie(request.nextUrl.origin)
    );

    return response;
  } catch (_error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
