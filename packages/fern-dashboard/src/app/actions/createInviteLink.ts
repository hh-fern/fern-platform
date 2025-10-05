"use server";

import { getCurrentSessionOrThrow } from "@fern-dashboard/services/auth/getCurrentSession";
import { createInviteToken } from "@fern-dashboard/services/auth/management";
import type { Auth0OrgName } from "@fern-dashboard/services/auth/types";
import { assertUserHasOrganizationAccess } from "../services/dal/organization";

export async function createInviteLink({ orgName }: { orgName: Auth0OrgName }) {
    const session = await getCurrentSessionOrThrow();
    await assertUserHasOrganizationAccess({
        token: session.accessToken,
        orgName
    });

    const { token, expiresAt } = await createInviteToken(orgName, session.user.sub);

    // Generate the invite URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dashboard.buildwithfern.com";
    const inviteUrl = `${baseUrl}/accept-invite/${token}`;

    return {
        token,
        inviteUrl,
        expiresAt
    };
}
