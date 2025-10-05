import { getCurrentSessionOrThrow } from "@fern-dashboard/services/auth/getCurrentSession";
import { redirect } from "next/navigation";

export default async function TokenPage() {
    const session = await getCurrentSessionOrThrow();

    if (session == null) {
        redirect("/");
    }

    return (
        <div className="flex items-center justify-center">
            <code className="break-all">{session.accessToken}</code>
        </div>
    );
}
