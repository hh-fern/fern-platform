import { ProtectedRoute } from "@fern-docs/components/auth/ProtectedRoute";
import { AppLayout } from "@fern-docs/components/layout/AppLayout";
import { ServerSidePylonSetup } from "@fern-docs/components/pylon/ServerSidePylonSetup";

import { Auth0OrgName } from "../../services/auth0/types";

export default async function AuthedLayout({
  params,
  children,
}: Readonly<{
  params: Promise<{ orgName: Auth0OrgName }>;
  children: React.JSX.Element;
}>) {
  const { orgName } = await params;

  return (
    <ProtectedRoute orgName={orgName}>
      <>
        <ServerSidePylonSetup />
        <AppLayout>{children}</AppLayout>
      </>
    </ProtectedRoute>
  );
}
