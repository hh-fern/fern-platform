import { getMyOrganizations as getMyOrganizationsFromAuth0 } from "@fern-dashboard/services/auth/management";
import type { Auth0UserID } from "@fern-dashboard/services/auth/types";

export default async function getMyOrganizations(userId: Auth0UserID) {
    return await getMyOrganizationsFromAuth0(userId);
}
