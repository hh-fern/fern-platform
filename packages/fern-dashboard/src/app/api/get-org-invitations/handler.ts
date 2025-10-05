import * as auth0Management from "@fern-dashboard/services/auth/management";
import type { Auth0OrgName } from "@fern-dashboard/services/auth/types";

export default async function getOrgInvitations(orgName: Auth0OrgName) {
    const invitations = await auth0Management.getOrgInvitations(orgName);
    return invitations;
}
