import { NextResponse } from "next/server";

import * as auth0Management from "@/app/services/auth0/management";
import { throwDigestibleError } from "@/utils/errors";

import { Auth0OrgName, Auth0UserID } from "../auth0/types";

/**
 * Asserts that the user has access to a given auth0 organization.
 *
 * @throws {DigestibleError} if the user does not have access to the organization
 */
export async function assertUserHasOrganizationAccess({
  userId,
  orgName,
}: {
  userId: Auth0UserID;
  orgName: Auth0OrgName;
}) {
  // Check if user belongs to organization
  const isUserInOrgFromUrl = await auth0Management.doesUserBelongsToOrg(
    userId,
    orgName
  );

  if (!isUserInOrgFromUrl) {
    throw throwDigestibleError(
      new Error(`User does not have access to the ${orgName} organization.`),
      "USER_NOT_IN_ORG"
    );
  }
}

/**
 * Validates that the user has access to the organization.
 *
 * @returns {NextResponse | null} null if the user has access to the organization, otherwise a NextResponse with the error message
 */
export async function assertApiCallerHasOrganizationAccess(options: {
  userId: Auth0UserID;
  orgName: Auth0OrgName;
}): Promise<NextResponse | null> {
  try {
    // Validate user organization access
    await assertUserHasOrganizationAccess({
      userId: options.userId,
      orgName: options.orgName,
    });
    return null;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Access denied" },
      { status: 403 }
    );
  }
}
