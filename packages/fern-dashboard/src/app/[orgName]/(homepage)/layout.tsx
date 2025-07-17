import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { updatePostHogProfile } from "@/components/posthog/ServerSidePostHogOrgNameUpdater";
import { ServerSidePylonSetup } from "@/components/pylon/ServerSidePylonSetup";

import { Auth0OrgName } from "../../services/auth0/types";

export default async function AuthedLayout({
  params,
  children,
}: Readonly<{
  params: Promise<{ orgName: Auth0OrgName }>;
  children: React.JSX.Element;
}>) {
  const { orgName } = await params;

  await updatePostHogProfile(orgName);

  return (
    <ProtectedRoute orgName={orgName}>
      <>
        <ServerSidePylonSetup />
        <AppLayout>{children}</AppLayout>
      </>
    </ProtectedRoute>
  );
}
