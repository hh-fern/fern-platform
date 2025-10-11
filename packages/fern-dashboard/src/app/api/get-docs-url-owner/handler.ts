import { Auth0OrgName } from "@/app/services/auth0/types";

import { getDocsUrlMetadata } from "../utils/getDocsUrlMetadata";
import { FdrLambda } from "@fern-api/fdr-lambda-sdk";

export default async function getDocsUrlOwnerHandler({
    url,
    token
}: {
    url: string;
    token: string;
}): Promise<{ orgName: Auth0OrgName | undefined }> {
    try {
        const docsUrlMetadata = await getDocsUrlMetadata({ url, token });
        return {
            orgName: Auth0OrgName(docsUrlMetadata.org)
        };
    } catch (error: unknown) {
        // the docs url is user-supplied (parsed from the page url) so it's ok if it
        // doesn't exist
        if (error instanceof FdrLambda.docs.v2.read.DomainNotRegisteredError) {
            return { orgName: undefined };
        }

        console.error("Failed to load docs URL metadata", JSON.stringify(error));
        throw new Error("Failed to load docs URL metadata");
    }

}
