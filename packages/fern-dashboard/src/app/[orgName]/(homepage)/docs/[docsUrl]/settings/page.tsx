import { Settings } from "@fern-docs/components/settings/Settings";

import { parseDocsUrlParam } from "@/utils/parseDocsUrlParam";

export default async function Page({
  params,
}: {
  params: Promise<{ docsUrl: string }>;
}) {
  const docsUrl = parseDocsUrlParam(await params);
  return <Settings docsUrl={docsUrl} />;
}
