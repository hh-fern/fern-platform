import type { Auth0OrgName } from "@fern-dashboard/services/auth/types";
import { OrgNameProvider } from "@fern-dashboard/visual-editor/client/providers";
import { ThemeProvider } from "next-themes";
import { AppLayout } from "@/components/layout/AppLayout";
import { SidepanelProvider } from "@/components/layout/SidepanelContext";
import { ServerSidePylonSetup } from "@/components/pylon/ServerSidePylonSetup";

export default async function AuthedLayout({
    params,
    children,
    sidepanel,
    navbar,
    header
}: Readonly<{
    params: Promise<{ orgName: Auth0OrgName }>;
    children: React.JSX.Element;
    sidepanel: React.ReactNode;
    navbar: React.ReactNode;
    header: React.ReactNode;
}>) {
    const { orgName } = await params;

    return (
        <>
            <ServerSidePylonSetup />
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                <OrgNameProvider orgName={orgName}>
                    <SidepanelProvider>
                        <AppLayout sidepanel={sidepanel} navbar={navbar} header={header}>
                            {children}
                        </AppLayout>
                    </SidepanelProvider>
                </OrgNameProvider>
            </ThemeProvider>
        </>
    );
}
