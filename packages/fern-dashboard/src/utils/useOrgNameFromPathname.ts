import type { Auth0OrgName } from "@fern-dashboard/services/auth/types";
import { useParams } from "next/navigation";

export function useOrgNameFromPathname() {
    const params = useParams();
    return params.orgName as Auth0OrgName;
}
