import { DocsLoader } from "@fern-docs/cache";
import { Agent, setGlobalDispatcher } from "undici";

setGlobalDispatcher(
  new Agent({
    connect: { timeout: 2147483647 },
    bodyTimeout: 0,
    headersTimeout: 2147483647,
  })
);

export interface OrgMetadata {
  orgId: string;
  isPreviewUrl: boolean;
}

export async function getOrgMetadataForDomain(
  domain: string
): Promise<OrgMetadata | undefined> {
  if (!domain || typeof domain !== "string") {
    return undefined;
  }

  try {
    const docsLoader = DocsLoader.create(domain).withEnvironment(
      process.env.NEXT_PUBLIC_FDR_ORIGIN
    );
    const metadata = await docsLoader.getMetadata();
    return metadata ?? undefined;
  } catch (_) {
    return undefined;
  }
}
