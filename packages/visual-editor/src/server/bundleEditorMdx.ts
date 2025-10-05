"use server";

import { createEditableDocsLoader } from "@fern-api/docs-loader";
import type { DocsLoader } from "@fern-api/docs-server/docs-loader";

import { getCurrentSession } from "@fern-dashboard/services/auth/getCurrentSession";
import { getHostFromHeaders } from "@fern-dashboard/services/utils/getHostFromHeaders";
import { bundleMDX as internalBundleMDX } from "@/server/mdx/bundle";
import type { EncodedDocsUrl } from "@/shared/types";

const BATCH_SIZE = 25;

type BundleResult = { ok: true; code: string } | { ok: false; error: string };

export async function bundleEditorMDX(
    sources: string[],
    options?: {
        docsUrl?: EncodedDocsUrl;
        branch?: string;
    }
): Promise<BundleResult[]> {
    const results: BundleResult[] = [];

    // Try to create a loader if docsUrl is provided
    let loader: DocsLoader | undefined;

    if (options?.docsUrl) {
        try {
            const session = await getCurrentSession();
            const host = await getHostFromHeaders();

            if (session && host) {
                const editableLoader = await createEditableDocsLoader({
                    host,
                    encodedDocsUrl: options.docsUrl,
                    fernToken: session.accessToken,
                    branchName: options.branch
                });

                loader = editableLoader;
            }
        } catch (error) {
            // biome-ignore lint/suspicious/noConsole: allow console.error for now
            console.warn("Failed to create loader for MDX bundling:", error);
            // Continue without loader
        }
    }

    for (let i = 0; i < sources.length; i += BATCH_SIZE) {
        const batch = sources.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(
            batch.map(async (source) => {
                try {
                    const result = await internalBundleMDX(source, { loader });
                    return { ok: true as const, code: result.code };
                } catch (error) {
                    return {
                        ok: false as const,
                        error: error instanceof Error ? error.message : String(error)
                    };
                }
            })
        );
        results.push(...batchResults);
    }

    return results;
}
