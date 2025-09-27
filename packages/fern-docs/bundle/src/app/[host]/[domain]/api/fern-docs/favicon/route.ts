import { NextResponse } from "next/server";

import { createCachedDocsLoader } from "@fern-api/docs-loader";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { host: string; domain: string } }
) {
  const { host } = params;

  try {
    const docs = await createCachedDocsLoader(host, domain);
    const [config, files] = await Promise.all([
      docs.getConfig(),
      docs.getFiles(),
    ]);

    if (!config.favicon || !files[config.favicon]?.src) {
      return new NextResponse("Favicon not found", { status: 404 });
    }

    const faviconUrl = files[config.favicon]?.src;
    if (!faviconUrl) {
      return new NextResponse("Favicon not found", { status: 404 });
    }

    // Proxy the favicon from S3
    const faviconRes = await fetch(faviconUrl);

    if (!faviconRes.ok) {
      return new NextResponse("Favicon not found", { status: 404 });
    }

    const headers = new Headers(faviconRes.headers);
    headers.set("Content-Type", "image/x-icon");
    // Set a longer cache duration for the favicon (1 year)
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    return new NextResponse(faviconRes.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    return new NextResponse("Failed to load favicon", { status: 500 });
  }
}
