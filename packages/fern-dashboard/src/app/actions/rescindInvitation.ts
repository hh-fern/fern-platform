"use server";

import { getCurrentSessionOrThrow } from "@fern-dashboard/services/auth/getCurrentSession";
import { getAuth0ManagementClient, getOrgIdFromName } from "@fern-dashboard/services/auth/management";
import type { Auth0OrgName } from "@fern-dashboard/services/auth/types";
import { assertUserHasOrganizationAccess } from "../services/dal/organization";

export async function rescindInvitation({ invitationId, orgName }: { invitationId: string; orgName: Auth0OrgName }) {
    const session = await getCurrentSessionOrThrow();
    await assertUserHasOrganizationAccess({
        token: session.accessToken,
        orgName
    });

    const auth0 = getAuth0ManagementClient();
    await auth0.organizations.deleteInvitation({
        id: await getOrgIdFromName(orgName),
        invitation_id: invitationId
    });
}
