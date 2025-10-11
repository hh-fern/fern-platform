import { withoutStaging } from "@fern-api/docs-utils";
import { fernToken_admin, getFdrLambdaOrigin } from "@fern-api/docs-server";
import { FdrLambda, FdrLambdaClient } from "@fern-api/fdr-lambda-sdk";

import { Auth0OrgName } from "@/app/services/auth0/types";

export async function getDocsUrlMetadata({ url, token }: { url: string; token: string }): Promise<FdrLambda.docs.v2.read.DocsUrlMetadata> {
    const client = new FdrLambdaClient({
        environment: getFdrLambdaOrigin(),
        token: token ?? fernToken_admin()
    });

    return await client.docs.v2.read.getDocsUrlMetadata({
        url: withoutStaging(url)
    });
}

export async function getDocsUrlOwner({
    url,
    token
}: {
    url: string;
    token: string;
}): Promise<{ orgName: Auth0OrgName }> {
    let metadata;
    try {
        metadata = await getDocsUrlMetadata({ url, token });
    } catch (error) {
        console.error("Failed to load docs URL metadata", error);
        throw new Error("Failed to load docs URL metadata");
    }

    return {
        orgName: Auth0OrgName(metadata.org)
    };
}
