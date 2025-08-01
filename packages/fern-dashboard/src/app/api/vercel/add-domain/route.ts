import { NextRequest, NextResponse } from "next/server";

import { Vercel } from "@vercel/sdk";

import { getCurrentSessionOrThrow } from "@/app/services/auth0/getCurrentSession";

const vercel = new Vercel({
  bearerToken: process.env.VERCEL_ACCESS_TOKEN,
});

export async function POST(request: NextRequest) {
  try {
    await getCurrentSessionOrThrow();

    const { domain } = await request.json();

    if (!domain || typeof domain !== "string") {
      return NextResponse.json(
        { error: { message: "Domain is required and must be a string" } },
        { status: 400 }
      );
    }

    if (!process.env.VERCEL_PROJECT_ID) {
      return NextResponse.json(
        { error: { message: "Vercel project ID not configured" } },
        { status: 500 }
      );
    }

    const result = await vercel.projects.addProjectDomain({
      idOrName: process.env.VERCEL_PROJECT_ID,
      teamId: process.env.VERCEL_TEAM_ID,
      requestBody: {
        name: domain,
      },
    });

    return NextResponse.json(result);
  } catch (_error: any) {
    console.error("Error adding domain:", _error);

    if (_error.body) {
      try {
        const errorBody = JSON.parse(_error.body);
        return NextResponse.json(
          { error: errorBody.error },
          { status: _error.status || 400 }
        );
      } catch {
        return NextResponse.json(
          { error: { message: "Unable to configure domain, try again later" } },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: { message: "Internal server error" } },
      { status: 500 }
    );
  }
}
