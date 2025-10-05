import { getCurrentSession } from "@fern-dashboard/services/auth/getCurrentSession";
import type { Auth0OrgName } from "@fern-dashboard/services/auth/types";
import { redirect } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ orgName: Auth0OrgName }> }) {
    const session = await getCurrentSession();
    if (session == null) {
        redirect("/");
    }

    const { orgName } = await params;

    redirect(`/${orgName}/docs`);
}
