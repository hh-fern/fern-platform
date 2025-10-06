import { getOrgMembers as getOrgMembersFromAuth0, isFernEmployee } from "@fern-dashboard/services/auth/management";
import type { Auth0OrgName, Auth0UserID } from "@fern-dashboard/services/auth/types";

export default async function getOrgMembers({ userId, orgName }: { userId: Auth0UserID; orgName: Auth0OrgName }) {
    const members = await getOrgMembersFromAuth0(orgName, {
        includeFernEmployees: await isFernEmployee(userId)
    });
    return members;
}
