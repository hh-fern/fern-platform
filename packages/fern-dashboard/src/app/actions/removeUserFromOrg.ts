"use server";

import { getCurrentSessionOrThrow } from "@fern-dashboard/services/auth/getCurrentSession";
import {
    createIsFernEmployee,
    getAuth0ManagementClient,
    getOrgIdFromName,
    invalidateCachesAfterAddingOrRemovingOrgMember
} from "@fern-dashboard/services/auth/management";
import type { Auth0OrgName, Auth0UserID } from "@fern-dashboard/services/auth/types";
import { assertUserHasOrganizationAccess } from "../services/dal/organization";

export async function removeUserFromOrg({
    userIdToRemove,
    orgName
}: {
    userIdToRemove: Auth0UserID;
    orgName: Auth0OrgName;
}) {
    const auth0 = getAuth0ManagementClient();
    const session = await getCurrentSessionOrThrow();
    const userId = session.user.sub;

    await assertUserHasOrganizationAccess({
        token: session.accessToken,
        orgName
    });

    if (userId === userIdToRemove) {
        throw new Error("User cannot remove themself");
    }

    const isFernEmployee = await createIsFernEmployee();

    if (!isFernEmployee(userId) && isFernEmployee(userIdToRemove)) {
        throw new Error("Non-fern-employee cannot remove fern-employee");
    }

    await auth0.organizations.deleteMembers({ id: await getOrgIdFromName(orgName) }, { members: [userIdToRemove] });

    await invalidateCachesAfterAddingOrRemovingOrgMember({
        orgName
    });
}
