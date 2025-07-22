import { NextRequest, NextResponse } from "next/server";

import { safeUrl } from "@fern-api/docs-server/safeUrl";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, payload, redirect } = body;

    if (!name || !payload) {
      return NextResponse.json(
        { error: "Missing required fields: name and payload" },
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
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 }
    );
  }
}
