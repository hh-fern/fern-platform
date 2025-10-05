import type { Auth0Organization } from "@fern-dashboard/services/auth/types";

export function getOrgDisplayName(org: Auth0Organization | undefined) {
    return org?.display_name ?? org?.name;
}
