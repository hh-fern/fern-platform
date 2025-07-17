import { redirect } from "next/navigation";

import { getCurrentSessionOrThrow } from "@/app/services/auth0/getCurrentSession";
import { Auth0UserID } from "@/app/services/auth0/types";
import { AsyncRedisCache } from "@/app/services/redis/AsyncRedisCache";
import {
  RedisCacheKey,
  RedisCacheKeyType,
} from "@/app/services/redis/cacheKey";

import { getServerSidePosthog } from "../getServerSidePosthog";
import { PosthogFeatureFlag, PosthogFeatureFlags } from "./flags";

const USER_ID_TO_FEATURE_FLAG_CACHE = new AsyncRedisCache(
  RedisCacheKeyType.FEATURE_FLAG_FOR_USER,
  { ttlInSeconds: 300, debug: false }
);

export declare namespace FeatureFlaggedServerSide {
  export interface Props {
    flag: PosthogFeatureFlag;
    redirectWhenDisabled?: boolean;
    children: React.JSX.Element;
  }
}

export async function FeatureFlaggedServerSide({
  flag,
  redirectWhenDisabled = false,
  children,
}: FeatureFlaggedServerSide.Props) {
  const session = await getCurrentSessionOrThrow();
  const isEnabled = await isFeatureFlagEnabledForUser(flag, session.user.sub);

  if (flag === PosthogFeatureFlag.ARIEL_ORG_TEST) {
    console.log("================================================");
    console.log("isEnabled", isEnabled);
    console.log("flag", flag);
    console.log("user", session.user.sub);
  }

  if (isEnabled) {
    return children;
  }

  if (redirectWhenDisabled) {
    redirect("/");
  }

  return null;
}

export async function isFeatureFlagEnabledForUser(
  featureFlag: PosthogFeatureFlag,
  userId: Auth0UserID
) {
  const cacheKey = RedisCacheKey.featureFlag(featureFlag, userId);
  return await USER_ID_TO_FEATURE_FLAG_CACHE.get(cacheKey, async () => {
    const posthog = getServerSidePosthog();
    const result = await posthog.isFeatureEnabled(featureFlag, userId);
    return result ?? false;
  });
}

export async function getAllFeatureFlags(userId: Auth0UserID) {
  const posthog = getServerSidePosthog();
  const flags = await posthog.getAllFlags(userId);
  return flags as PosthogFeatureFlags;
}
