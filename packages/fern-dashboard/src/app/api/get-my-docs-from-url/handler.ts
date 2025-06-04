import { FdrAPI } from "@fern-api/fdr-sdk";

import { getFdrClient } from "@/app/services/fdr/getFdrClient";

export default async function getDocsFromUrl({
  url,
  token,
}: {
  url: string;
  token: string;
}) {
  const fdr = getFdrClient({ token });
  const docs = await fdr.docs.v2.read.getDocsForUrl({
    url: FdrAPI.Url(url),
  });
  if (!docs.ok) {
    console.error("Failed to load docs sites", JSON.stringify(docs.error));
    throw new Error("Failed to load docs sites");
  }

  return docs.body;
}
