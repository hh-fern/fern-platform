import { NextRequest, NextResponse } from "next/server";

import { Vercel } from "@vercel/sdk";

import { getCurrentSessionOrThrow } from "@/app/services/auth0/getCurrentSession";
import { DomainStatus } from "@/types/vercel";

const vercel = new Vercel({
  bearerToken: process.env.VERCEL_ACCESS_TOKEN,
});

async function getDomainConfig(domain: string) {
  try {
    const result = await vercel.domains.getDomainConfig({
      domain: domain,
      teamId: process.env.VERCEL_TEAM_ID,
    });
    return result;
  } catch (_error: any) {
    return null;
  }
}

async function getProjectDomain(domain: string) {
  try {
    const projectId = process.env.VERCEL_PROJECT_ID;
    if (!projectId) {
      throw new Error("VERCEL_PROJECT_ID not configured");
    }

    const result = await vercel.projects.getProjectDomain({
      idOrName: projectId,
      domain: domain,
      teamId: process.env.VERCEL_TEAM_ID,
    });
    return result;
  } catch (_error: any) {
    return null;
  }
}

async function checkDomainStatus(domain: string): Promise<DomainStatus> {
  const [configResult, projectResult] = await Promise.all([
    getDomainConfig(domain),
    getProjectDomain(domain),
  ]);

  // Log what we got from Vercel for debugging
  console.log(`Domain status check for ${domain}:`, {
    hasConfig: !!configResult,
    hasProject: !!projectResult,
    verified: projectResult?.verified,
    misconfigured: configResult?.misconfigured,
  });

  // If we can't find the domain in the project, it might not be added yet
  // For newly added domains, Vercel might need time to process
  if (!projectResult) {
    console.warn(
      `Could not find domain ${domain} in project - might still be processing`
    );

    // Instead of immediately returning error, return a "verifying" status
    // This gives Vercel more time to process the domain addition
    return {
      status: "verifying",
      message: "Domain is being configured. This may take a few moments...",
    };
  }

  const verified = projectResult.verified;
  const misconfigured = configResult?.misconfigured || false;

  // Be more strict about verification - only mark as ready if both verified AND not misconfigured
  if (verified && !misconfigured) {
    return { status: "ready", message: "Domain is ready to use" };
  }

  // If verified but misconfigured, still needs DNS setup
  if (verified && misconfigured) {
    console.log(
      `Domain ${domain} is verified but misconfigured - needs DNS configuration`
    );
    // Don't return ready here, let it fall through to DNS instructions
  }

  // If not verified, definitely needs DNS setup
  if (!verified) {
    console.log(`Domain ${domain} is not verified - needs DNS configuration`);
  }

  // Domain needs DNS configuration
  const instructions: string[] = [];

  if (!verified && projectResult.verification) {
    for (const record of projectResult.verification) {
      if (record.type === "TXT") {
        instructions.push(
          `Add TXT record for ${record.domain} with value: ${record.value}`
        );
      }
    }
  }

  if (
    misconfigured ||
    (!verified &&
      projectResult.verification?.some((r: any) => r.type === "CNAME"))
  ) {
    const subdomain = projectResult.name.replace(
      "." + projectResult.apexName,
      ""
    );
    instructions.push(
      `Add CNAME record for ${subdomain} with value: cname.vercel-dns.com`
    );
  }

  return {
    status: "needs_dns",
    message: "DNS configuration required",
    instructions: instructions,
  };
}

export async function GET(request: NextRequest) {
  try {
    await getCurrentSessionOrThrow();

    const { searchParams } = new URL(request.url);
    const domain = searchParams.get("domain");

    if (!domain) {
      return NextResponse.json(
        { error: "Domain parameter is required" },
        { status: 400 }
      );
    }

    if (!process.env.VERCEL_PROJECT_ID) {
      console.error("VERCEL_PROJECT_ID environment variable not set");
      return NextResponse.json(
        { error: "Vercel project ID not configured" },
        { status: 500 }
      );
    }

    if (!process.env.VERCEL_ACCESS_TOKEN) {
      console.error("VERCEL_ACCESS_TOKEN environment variable not set");
      return NextResponse.json(
        { error: "Vercel access token not configured" },
        { status: 500 }
      );
    }

    console.log(`Checking domain status for: ${domain}`);
    const status = await checkDomainStatus(domain);
    console.log(`Domain status result for ${domain}:`, status);

    return NextResponse.json(status);
  } catch (_error: any) {
    console.error("Error checking domain status:", _error);

    return NextResponse.json(
      {
        error:
          "Unable to check domain status. Please try again or contact support.",
      },
      { status: 500 }
    );
  }
}
