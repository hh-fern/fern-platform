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

    if (redirect && safeUrl(redirect)) {
      const url = new URL(redirect);
      // only allow relative redirects within the same origin
      if (url.origin === new URL(request.url).origin) {
        response = NextResponse.redirect(redirect);
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
