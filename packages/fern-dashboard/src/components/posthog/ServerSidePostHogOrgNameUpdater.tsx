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
    await posthog.identify({
      distinctId: session.user.sub,
      properties: {
        orgName: orgName,
      },
    });
  }

  return null;
}
