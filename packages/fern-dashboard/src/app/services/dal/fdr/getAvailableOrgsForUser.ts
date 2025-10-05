import "server-only";

import { getMyOrganizations } from "@fern-dashboard/services/auth/management";
import type { Auth0UserID } from "@fern-dashboard/services/auth/types";
import { cache } from "react";

export const getAvailableOrgsForUser = cache(async ({ userId }: { userId: Auth0UserID }) => {
    return await getMyOrganizations(userId);
});
