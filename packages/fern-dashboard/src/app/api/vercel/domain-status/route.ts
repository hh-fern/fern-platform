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
  } catch (error: any) {
    return null;
  }
}

async function getProjectDomain(domain: string) {
  try {
    const result = await vercel.projects.getProjectDomain({
      idOrName: process.env.VERCEL_PROJECT_ID || "",
      domain: domain,
      teamId: process.env.VERCEL_TEAM_ID,
    });
    return result;
  } catch (error: any) {
    return null;
  }
}

async function checkDomainStatus(domain: string): Promise<DomainStatus> {
  const [configResult, projectResult] = await Promise.all([
    getDomainConfig(domain), 
    getProjectDomain(domain)
  ]);

  if (!projectResult) {
    return { status: 'error', message: 'Domain not found' };
  }

  const verified = projectResult.verified;
  const misconfigured = configResult?.misconfigured || false;

  if (verified && !misconfigured) {
    return { status: 'ready', message: 'Domain is ready to use' };
  }

  const instructions: string[] = [];
  
  if (!verified && projectResult.verification) {
    for (const record of projectResult.verification) {
      if (record.type === 'TXT') {
        instructions.push(`Add TXT record for ${record.domain} with value: ${record.value}`);
      }
    }
  }
  
  if (misconfigured || (!verified && projectResult.verification?.some((r: any) => r.type === 'CNAME'))) {
    const subdomain = projectResult.name.replace('.' + projectResult.apexName, '');
    instructions.push(`Add CNAME record for ${subdomain} with value: cname.vercel-dns.com`);
  }

  return { 
    status: 'needs_dns', 
    message: 'DNS configuration required',
    instructions: instructions
  };
}

export async function GET(request: NextRequest) {
  try {
    await getCurrentSessionOrThrow();

    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');

    if (!domain) {
      return NextResponse.json(
        { error: "Domain parameter is required" },
        { status: 400 }
      );
    }

    if (!process.env.VERCEL_PROJECT_ID) {
      return NextResponse.json(
        { error: "Vercel project ID not configured" },
        { status: 500 }
      );
    }

    const status = await checkDomainStatus(domain);
    return NextResponse.json(status);

  } catch (error: any) {
    console.error("Error checking domain status:", error);
    return NextResponse.json(
      { error: "Failed to check domain status" },
      { status: 500 }
    );
  }
} 