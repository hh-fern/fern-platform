import { NextRequest, NextResponse } from "next/server";
import { Vercel } from "@vercel/sdk";

import { getCurrentSessionOrThrow } from "@/app/services/auth0/getCurrentSession";

const vercel = new Vercel({
  bearerToken: process.env.VERCEL_ACCESS_TOKEN,
});

export async function DELETE(request: NextRequest) {
  try {
    await getCurrentSessionOrThrow();

    const { domain } = await request.json();

    if (!domain || typeof domain !== 'string') {
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

    // Delete domain from project
    await vercel.projects.removeProjectDomain({
      idOrName: process.env.VERCEL_PROJECT_ID,
      domain: domain,
      teamId: process.env.VERCEL_TEAM_ID,
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Error deleting domain:", error);
    
    // If domain doesn't exist, that's OK - consider it success
    if (error.status === 404) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: { message: "Failed to delete domain" } },
      { status: 500 }
    );
  }
} 