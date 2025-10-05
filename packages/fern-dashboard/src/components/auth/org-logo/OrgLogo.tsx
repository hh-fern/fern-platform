import type { Auth0Organization } from "@fern-dashboard/services/auth/types";

import { OrgLogoContent } from "./OrgLogoContent";

export declare namespace OrgLogo {
    export interface Props {
        organization: Auth0Organization;
    }
}

export function OrgLogo({ organization }: OrgLogo.Props) {
    return (
        <div className="flex size-6">
            <OrgLogoContent organization={organization} />
        </div>
    );
}
