import { redirect } from "next/navigation";

import { DocsZeroState } from "@/components/docs-page/DocsZeroState";
import { AppLayout } from "@/components/layout/AppLayout";
import { SidepanelProvider } from "@/components/layout/SidepanelContext";
import { getCurrentSession } from "../../../../fern-dashboard-services/src/getCurrentSession";
import HeaderLayout from "../[orgName]/(homepage)/@header/default";

export default async function Page({ params }: { params: Promise<{}> }) {
    const session = await getCurrentSession();
    if (session == null) {
        redirect("/");
    }

    return (
        <SidepanelProvider>
            <AppLayout sidepanel={null} navbar={null} header={<HeaderLayout params={params} />}>
                <DocsZeroState user={session.user} />
            </AppLayout>
        </SidepanelProvider>
    );
}
