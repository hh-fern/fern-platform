import { getCurrentSessionOrThrow } from "@fern-dashboard/services/auth/getCurrentSession";
import type { Auth0OrgName } from "@fern-dashboard/services/auth/types";
import { PosthogFeatureFlag } from "@/components/posthog/feature-flags/flags";
import { FeatureFlaggedServerSide } from "@/components/posthog/feature-flags/server-side";
import { SDKsZeroState } from "@/components/sdks-page/SDKsZeroState";

export default async function Page({ params }: { params: Promise<{ orgName: Auth0OrgName }> }) {
    const { orgName } = await params;
    const session = await getCurrentSessionOrThrow();

    return (
        <FeatureFlaggedServerSide flag={PosthogFeatureFlag.ENABLE_SDKS_PAGE} redirectWhenDisabled orgName={orgName}>
            <SDKsZeroState user={session.user} />
        </FeatureFlaggedServerSide>
    );
}
