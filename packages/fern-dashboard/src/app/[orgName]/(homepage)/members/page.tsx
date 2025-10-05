import { getCurrentSession } from "@fern-dashboard/services/auth/getCurrentSession";
import { redirect } from "next/navigation";
import { MembersPage } from "@/components/members/MembersPage";

export default async function Page() {
    const session = await getCurrentSession();
    if (session == null) {
        redirect("/");
    }
    return <MembersPage session={session} />;
}
