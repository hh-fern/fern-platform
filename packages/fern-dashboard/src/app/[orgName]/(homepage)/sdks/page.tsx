import { PosthogFeatureFlag } from "@fern-docs/components/posthog/feature-flags/flags";
import { FeatureFlaggedServerSide } from "@fern-docs/components/posthog/feature-flags/server-side";

export default async function Page() {
  return (
    <FeatureFlaggedServerSide
      flag={PosthogFeatureFlag.ENABLE_SDKS_PAGE}
      redirectWhenDisabled
    >
      <div>sdks!</div>
    </FeatureFlaggedServerSide>
  );
}
