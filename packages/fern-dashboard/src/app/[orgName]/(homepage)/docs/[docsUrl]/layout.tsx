import { DocsSiteLayout } from "@fern-docs/components/docs-page/DocsSiteLayout";
import { getAllFeatureFlags } from "@fern-docs/components/posthog/feature-flags/server-side";

import { getCurrentSessionOrThrow } from "@/app/services/auth0/getCurrentSession";
import { parseDocsUrlParam } from "@/utils/parseDocsUrlParam";

export default async function Layout({
  params,
  children,
}: Readonly<{
  params: Promise<{ orgName: string; docsUrl: string }>;
  children: React.JSX.Element;
}>) {
  const { orgName, ..._params } = await params;
  const docsUrl = parseDocsUrlParam(_params);
  const session = await getCurrentSessionOrThrow();

  return (
    <DocsSiteLayout
      docsUrl={docsUrl}
      orgName={orgName}
      featureFlags={await getAllFeatureFlags(session.user.sub)}
    >
      <>{children}</>
    </DocsSiteLayout>
  );
}
