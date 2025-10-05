import { isFernEmployee } from "@fern-dashboard/services/auth/management";
import type { Auth0OrgName } from "@fern-dashboard/services/auth/types";
import { redirect } from "next/navigation";
import { getAuthenticatedSessionOrRedirect } from "@/app/services/dal/organization";
import { Settings } from "@/components/settings/Settings";
import { parseDocsUrlParam } from "@/utils/parseDocsUrlParam";
import type { EncodedDocsUrl } from "@/utils/types";

export default async function Page({
    params
}: {
    params: Promise<{ orgName: Auth0OrgName; docsUrl: EncodedDocsUrl }>;
}) {
    const { orgName, docsUrl: encodedDocsUrl } = await params;
    const docsUrl = parseDocsUrlParam({ docsUrl: encodedDocsUrl });

    const session = await getAuthenticatedSessionOrRedirect(orgName);

    const isEmployee = await isFernEmployee(session.user.sub);
    if (!isEmployee) {
        redirect(`/${orgName}/docs/${docsUrl}`);
    }

    return <Settings docsUrl={docsUrl} hasFernEmail={isEmployee} orgName={orgName} />;
}
