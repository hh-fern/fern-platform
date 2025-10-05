"use client";

import type { Auth0OrgName } from "@fern-dashboard/services/auth/types";
import { createContext, useContext } from "react";

const OrgNameContext = createContext<Auth0OrgName | null>(null);

export function useOrgName(): Auth0OrgName {
    const context = useContext(OrgNameContext);
    if (context == null) {
        throw new Error("useOrgName must be used within an OrgNameProvider");
    }

    return context;
}

interface OrgNameProviderProps {
    orgName: Auth0OrgName;
    children: React.ReactNode;
}

export function OrgNameProvider({ orgName, children }: OrgNameProviderProps) {
    return <OrgNameContext.Provider value={orgName}>{children}</OrgNameContext.Provider>;
}
