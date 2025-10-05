import type { Auth0Organization } from "@fern-dashboard/services/auth/types";

import { OrgPlaceholderLogo } from "./OrgPlaceholderLogo";
import { SvgOrgLogo } from "./SvgOrgLogo";

export declare namespace OrgLogoContent {
    export interface Props {
        organization: Auth0Organization;
    }
}

export function OrgLogoContent({ organization }: OrgLogoContent.Props) {
    if (organization.branding?.logo_url == null) {
        return <OrgPlaceholderLogo org={organization} />;
    }

    if (organization.branding.logo_url.endsWith(".svg")) {
        return (
            <SvgOrgLogo svgUrl={organization.branding.logo_url} fallback={<OrgPlaceholderLogo org={organization} />} />
        );
    }

    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={organization.branding.logo_url} alt={`${organization.display_name} logo`} />
    );
}
