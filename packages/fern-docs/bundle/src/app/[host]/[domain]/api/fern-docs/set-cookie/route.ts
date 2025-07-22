import { NextRequest, NextResponse } from "next/server";

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

    let response: NextResponse;

    if (redirect && safeUrl(redirect)) {
      response = NextResponse.redirect(redirect);
    } else {
      response = NextResponse.json({ success: true });
    }

    response.cookies.set(name, payload, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (_error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
