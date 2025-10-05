import "server-only";

import { cache } from "react";

import type { Auth0UserID } from "@/app/services/auth0/types";

import { getMyOrganizations } from "../../../../../../fern-dashboard-services/src/management";

export const getAvailableOrgsForUser = cache(async ({ userId }: { userId: Auth0UserID }) => {
    return await getMyOrganizations(userId);
});
