import { ProtectedRoute } from "@fern-docs/components/auth/ProtectedRoute";
import { VisualEditorLayout } from "@fern-docs/components/layout/VisualEditorLayout";

import { Auth0OrgName } from "@/app/services/auth0/types";

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
      <VisualEditorLayout>{children}</VisualEditorLayout>
    </ProtectedRoute>
  );
}
