import { getCurrentSession } from "@/app/services/auth0/getCurrentSession";
import { getServerSidePosthog } from "@/components/posthog/getServerSidePosthog";
import { invalidateFeatureFlagCache } from "@/components/posthog/feature-flags/server-side";
import { Auth0OrgName } from "@/app/services/auth0/types";

export declare namespace ServerSidePostHogOrgNameUpdater {
  export interface Props {
    orgName: Auth0OrgName;
  }
}

export async function ServerSidePostHogOrgNameUpdater({ 
  orgName 
}: ServerSidePostHogOrgNameUpdater.Props) {
  console.log("ServerSidePostHogOrgNameUpdater");
  console.log("orgName", orgName);
  
  const session = await getCurrentSession();
  
  if (session?.user?.sub) {
    const posthog = getServerSidePosthog();
    
    try {
      // Update the person's properties with the current orgName and other user info
      await posthog.identify({
        distinctId: session.user.sub,
        properties: {
          orgName: orgName,
          email: session.user.email,
          name: session.user.name,
          // Add a timestamp to potentially force cache invalidation
          lastOrgUpdate: new Date().toISOString(),
        },
      });
      
      // Force the update to be processed by calling shutdown
      await posthog.shutdown();
      
      // Invalidate feature flag cache so flags are re-evaluated with new orgName
      await invalidateFeatureFlagCache(session.user.sub);
      
      console.log("PostHog profile updated for user:", session.user.sub);
    } catch (error) {
      console.error("Failed to update PostHog profile:", error);
    }
  }

  return null;
}

// Export a function that can be awaited to ensure the update completes
export async function updatePostHogProfile(orgName: Auth0OrgName) {
  await ServerSidePostHogOrgNameUpdater({ orgName });
}
