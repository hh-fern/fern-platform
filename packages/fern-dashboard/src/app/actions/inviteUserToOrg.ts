"use server";

import { getAuth0ClientId } from "@fern-dashboard/services/auth/auth0";
import { getCurrentSessionOrThrow } from "@fern-dashboard/services/auth/getCurrentSession";
import { getAuth0ManagementClient, getOrgIdFromName } from "@fern-dashboard/services/auth/management";
import type { Auth0OrgName } from "@fern-dashboard/services/auth/types";
import { assertUserHasOrganizationAccess } from "../services/dal/organization";

export async function inviteUserToOrg({ inviteeEmail, orgName }: { inviteeEmail: string; orgName: Auth0OrgName }) {
    const auth0 = getAuth0ManagementClient();
    const session = await getCurrentSessionOrThrow();
    await assertUserHasOrganizationAccess({
        token: session.accessToken,
        orgName
    });

    const invitation = await auth0.organizations.createInvitation(
        { id: await getOrgIdFromName(orgName) },
        {
            inviter: { name: session.user.name ?? "" },
            invitee: { email: inviteeEmail },
            client_id: getAuth0ClientId(),
            send_invitation_email: true
        }
    );

    return {
        invitationId: invitation.data.id
    };
}
