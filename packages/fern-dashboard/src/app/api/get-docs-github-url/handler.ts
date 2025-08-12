import { fernToken_admin } from "@fern-api/docs-server";

import { getDocsUrlMetadata } from "../utils/getDocsUrlMetadata";

export default async function getDocsGithubUrlHandler({
  url,
  token,
}: {
  url: string;
  token: string;
}): Promise<string> {
  const docsUrlMetadata = await getDocsUrlMetadata({
    url: decodeURIComponent(url),
    token: fernToken_admin() ?? token,
  });
  if (!docsUrlMetadata.ok) {
    // the docs url is user-supplied (parsed from the page url) so it's ok if it
    // doesn't exist
    if (docsUrlMetadata.error.error === "DomainNotRegisteredError") {
      // Don't cache this failure, so throw to skip cache
      throw new Error("DomainNotRegisteredError");
    }

    console.error(
      "Failed to load docs URL metadata",
      JSON.stringify(docsUrlMetadata.error)
    );
    throw new Error(
      `Unable to find that domain. Please check that the domain "${decodeURIComponent(
        url
      )}" is correct.`
    );
  }

  if (docsUrlMetadata.body.gitUrl == null) {
    // Don't cache this failure, so throw to skip cache
    throw new Error("NoGitUrl");
  }

  const [owner, repo] = docsUrlMetadata.body.gitUrl.split("/").slice(-2);
  if (owner == null || repo == null) {
    // Don't cache this failure, so throw to skip cache
    throw new Error("InvalidGitUrl");
  }

  return docsUrlMetadata.body.gitUrl;
}
