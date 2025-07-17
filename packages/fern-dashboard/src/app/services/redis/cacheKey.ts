import {
  GetInvitations200ResponseOneOfInner,
  GetMembers200ResponseOneOfInner,
} from "auth0";

import { PosthogFeatureFlag } from "../../../components/posthog/feature-flags/flags";
import {
  Auth0OrgID,
  Auth0OrgName,
  Auth0Organization,
  Auth0UserID,
} from "../auth0/types";

export type RedisCacheKey<T extends RedisCacheKeyType> = string & {
  __type: T;
};

export const RedisCacheKeyType = {
  ORGANIZATION: "ORGANIZATION",
  ORGANIZATION_MEMBERS: "ORGANIZATION_MEMBERS",
  ORGANIZATION_INVITATIONS: "ORGANIZATION_INVITATIONS",
  ORGANIZATION_NAME_TO_ID: "ORGANIZATION_NAME_TO_ID",
  FEATURE_FLAG_FOR_USER: "FEATURE_FLAG_FOR_USER",
} as const;

export type RedisCacheKeyType =
  (typeof RedisCacheKeyType)[keyof typeof RedisCacheKeyType];

export type RedisCacheDataTypes = {
  [RedisCacheKeyType.ORGANIZATION]: Auth0Organization;
  [RedisCacheKeyType.ORGANIZATION_MEMBERS]: GetMembers200ResponseOneOfInner[];
  [RedisCacheKeyType.ORGANIZATION_INVITATIONS]: GetInvitations200ResponseOneOfInner[];
  [RedisCacheKeyType.ORGANIZATION_NAME_TO_ID]: Auth0OrgID;
  [RedisCacheKeyType.FEATURE_FLAG_FOR_USER]: boolean;
};

export const RedisCacheKey = {
  organization: (orgName: Auth0OrgName) =>
    cacheKey(RedisCacheKeyType.ORGANIZATION)(`org-${orgName}`),
  organizationMembers: (orgName: Auth0OrgName) =>
    cacheKey(RedisCacheKeyType.ORGANIZATION_MEMBERS)(`org-members-${orgName}`),
  organizationInvitations: (orgName: Auth0OrgName) =>
    cacheKey(RedisCacheKeyType.ORGANIZATION_INVITATIONS)(
      `org-invitations-${orgName}`
    ),
  organizationNameToId: (orgName: Auth0OrgName) =>
    cacheKey(RedisCacheKeyType.ORGANIZATION_NAME_TO_ID)(
      `org-name-to-id-${orgName}`
    ),
  featureFlag: (flag: PosthogFeatureFlag, userId: Auth0UserID) =>
    cacheKey(RedisCacheKeyType.FEATURE_FLAG_FOR_USER)(
      `feature-flag-for-user-${flag}-${userId}`
    ),
};

function cacheKey<T extends RedisCacheKeyType>(_type: T) {
  return (key: string) => key as unknown as RedisCacheKey<T>;
}

export type inferCachedData<T extends RedisCacheKeyType> =
  RedisCacheDataTypes[T];
