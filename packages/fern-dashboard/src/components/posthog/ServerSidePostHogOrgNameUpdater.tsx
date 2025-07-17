import { getCurrentSession } from "@/app/services/auth0/getCurrentSession";
import { Auth0OrgName } from "@/app/services/auth0/types";
import { getServerSidePosthog } from "@/components/posthog/getServerSidePosthog";

export declare namespace ServerSidePostHogOrgNameUpdater {
  export interface Props {
    orgName: Auth0OrgName;
  }
}

export async function ServerSidePostHogOrgNameUpdater({
  orgName,
}: ServerSidePostHogOrgNameUpdater.Props) {
  console.log("ServerSidePostHogOrgNameUpdater");
  console.log("orgName", orgName);

  const session = await getCurrentSession();

  if (session?.user?.sub) {
    const posthog = getServerSidePosthog();
    try {
      await posthog.identify({
        distinctId: session.user.sub,
        properties: {
          orgName: orgName,
          email: session.user.email,
          name: session.user.name,
        },
      });
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
