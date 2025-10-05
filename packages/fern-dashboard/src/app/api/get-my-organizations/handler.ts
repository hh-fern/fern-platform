import * as auth0Management from "@fern-dashboard/services/auth/management";
import type { Auth0UserID } from "@fern-dashboard/services/auth/types";

export default async function getMyOrganizations(userId: Auth0UserID) {
    return await auth0Management.getMyOrganizations(userId);
}
