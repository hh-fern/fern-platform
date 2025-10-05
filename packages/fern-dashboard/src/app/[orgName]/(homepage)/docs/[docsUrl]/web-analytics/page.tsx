import type { Auth0OrgName } from "@fern-dashboard/services/auth/types";
import { getAuthenticatedSessionOrRedirect } from "@/app/services/dal/organization";
import WebAnalyticsPage from "@/components/web-analytics/WebAnalyticsPage";

export default async function Page(props: { params: Promise<{ orgName: Auth0OrgName; docsUrl: string }> }) {
    const params = await props.params;
    await getAuthenticatedSessionOrRedirect(params.orgName);

    return <WebAnalyticsPage docsUrl={params.docsUrl} />;
}
