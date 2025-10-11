import "server-only";

import { fernToken_admin } from "@fern-api/docs-server";

import { getDocsUrlMetadata } from "@/app/api/utils/getDocsUrlMetadata";

interface GetDocsGithubUrlSuccess {
    success: true;
    githubUrl: string;
}

interface GetDocsGithubUrlError {
    success: false;
    error:
        | { type: "MALFORMED_GITHUB_URL"; url: string }
        | { type: "DOMAIN_NOT_REGISTERED" }
        | { type: "REPO_NOT_CONNECTED" };
}

type GetDocsGithubUrlResult = GetDocsGithubUrlSuccess | GetDocsGithubUrlError;
export default async function getDocsGithubUrl({
    url,
    token
}: {
    url: string;
    token: string;
}): Promise<GetDocsGithubUrlResult> {
    let docsUrlMetadata;
    try {
        docsUrlMetadata = await getDocsUrlMetadata({
            url: decodeURIComponent(url),
            token: fernToken_admin() ?? token
        });
    } catch (error) {
            // the docs url is user-supplied (parsed from the page url) so it's ok if it
        // doesn't exist
        if (error instanceof Error && error.message === "DomainNotRegisteredError") {
            // Don't cache this failure, so throw to skip cache
            return { success: false, error: { type: "DOMAIN_NOT_REGISTERED" } };
        }

        console.error("Failed to load docs URL metadata", error);
        return {
            success: false,
            error: { type: "MALFORMED_GITHUB_URL", url: decodeURIComponent(url) }
        };
    }

    if (docsUrlMetadata.gitUrl == null) {
        // Don't cache this failure, so throw to skip cache
        return { success: false, error: { type: "REPO_NOT_CONNECTED" } };
    }

    const [owner, repo] = docsUrlMetadata.gitUrl.split("/").slice(-2);
    if (owner == null || repo == null) {
        // Don't cache this failure, so throw to skip cache
        return {
            success: false,
            error: { type: "MALFORMED_GITHUB_URL", url: docsUrlMetadata.gitUrl }
        };
    }

    return { success: true, githubUrl: docsUrlMetadata.gitUrl };
}
