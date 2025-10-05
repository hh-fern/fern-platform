import * as auth0Management from "@fern-dashboard/services/auth/management";
import type { Auth0OrgName, Auth0UserID } from "@fern-dashboard/services/auth/types";

export default async function getOrgMembers({ userId, orgName }: { userId: Auth0UserID; orgName: Auth0OrgName }) {
    const members = await auth0Management.getOrgMembers(orgName, {
        includeFernEmployees: await auth0Management.isFernEmployee(userId)
    });
    return members;
}
