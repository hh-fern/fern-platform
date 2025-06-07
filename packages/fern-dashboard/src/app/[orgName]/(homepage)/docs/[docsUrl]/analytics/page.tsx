import { PosthogFeatureFlag } from "@fern-docs/components/posthog/feature-flags/flags";
import { FeatureFlaggedServerSide } from "@fern-docs/components/posthog/feature-flags/server-side";

export default async function Page(_props: {
  params: Promise<{ docsUrl: string }>;
}) {
  return (
    <FeatureFlaggedServerSide
      flag={PosthogFeatureFlag.ENABLE_DOCS_ANALYTICS_TAB}
      redirectWhenDisabled
    >
      <div>analytics</div>
    </FeatureFlaggedServerSide>
  );
}
