import type { Auth0OrgName } from "@fern-dashboard/services/auth/types";
import { getAuthenticatedSessionOrRedirect } from "@/app/services/dal/organization";
import type { EncodedDocsUrl } from "@/utils/types";

export default async function DocsLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ docsUrl: EncodedDocsUrl; orgName: Auth0OrgName }>;
}) {
    const { orgName } = await params;

    await getAuthenticatedSessionOrRedirect(orgName);

    return <>{children}</>;
}
