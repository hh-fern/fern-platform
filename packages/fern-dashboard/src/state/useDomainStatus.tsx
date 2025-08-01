"use client";

import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface DomainStatus {
  status: "ready" | "needs_dns" | "error" | "pending" | "verifying";
  message?: string;
  instructions?: string[];
  timestamp?: number;
}

interface DomainStatusContextType {
  domainStatuses: Record<string, DomainStatus>;
  setDomainStatus: (domain: string, status: DomainStatus) => void;
  verifyingDomains: Set<string>;
  setVerifyingDomain: (domain: string, isVerifying: boolean) => void;
  getOverallStatus: (
    domains: string[]
  ) => "live" | "pending" | "verifying" | "error";
}

const DomainStatusContext = createContext<DomainStatusContextType | undefined>(
  undefined
);

const STORAGE_KEY = "fern-domain-statuses";

// Helper functions for localStorage
const saveDomainStatuses = (statuses: Record<string, DomainStatus>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(statuses));
  } catch (error) {
    console.warn("Failed to save domain statuses to localStorage:", error);
  }
};

const loadDomainStatuses = (): Record<string, DomainStatus> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Only load recent statuses (within last 24 hours) to avoid stale data
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const filteredStatuses: Record<string, DomainStatus> = {};

      Object.entries(parsed).forEach(([domain, status]: [string, any]) => {
        // If status has a timestamp and it's recent, or if it's 'ready' status (which is stable)
        if (
          status?.status === "ready" ||
          (status?.timestamp && status.timestamp > oneDayAgo)
        ) {
          filteredStatuses[domain] = status;
        }
      });

      return filteredStatuses;
    }
  } catch (error) {
    console.warn("Failed to load domain statuses from localStorage:", error);
  }
  return {};
};

export function DomainStatusProvider({ children }: { children: ReactNode }) {
  const [domainStatuses, setDomainStatuses] = useState<
    Record<string, DomainStatus>
  >({});
  const [verifyingDomains, setVerifyingDomains] = useState<Set<string>>(
    new Set()
  );
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const loadedStatuses = loadDomainStatuses();
    setDomainStatuses(loadedStatuses);
    setIsInitialized(true);
  }, []);

  const setDomainStatus = useCallback(
    (domain: string, status: DomainStatus) => {
      const statusWithTimestamp = {
        ...status,
        timestamp: Date.now(),
      };

      setDomainStatuses((prev) => {
        const newStatuses = { ...prev, [domain]: statusWithTimestamp };
        // Save to localStorage whenever status changes
        saveDomainStatuses(newStatuses);
        return newStatuses;
      });
    },
    []
  );

  const setVerifyingDomain = useCallback(
    (domain: string, isVerifying: boolean) => {
      setVerifyingDomains((prev) => {
        const newSet = new Set(prev);
        if (isVerifying) {
          newSet.add(domain);
        } else {
          newSet.delete(domain);
        }
        return newSet;
      });
    },
    []
  );

  const getOverallStatus = useCallback(
    (domains: string[]) => {
      if (domains.length === 0) return "live"; // No custom domains = live

      const customDomains = domains.filter(
        (domain) => !domain.includes("buildwithfern.com")
      );
      if (customDomains.length === 0) return "live"; // Only Fern subdomains = live

      // Check if any domain is being verified
      const hasVerifying = customDomains.some((domain) =>
        verifyingDomains.has(domain)
      );
      if (hasVerifying) return "verifying";

      // Check domain statuses
      const statuses = customDomains.map(
        (domain) => domainStatuses[domain]?.status
      );

      // If any domain has error status
      if (statuses.some((status) => status === "error")) return "error";

      // If all domains are ready
      if (statuses.every((status) => status === "ready")) return "live";

      // If we haven't initialized from localStorage yet, don't show pending immediately
      if (!isInitialized) return "live";

      // Otherwise, pending
      return "pending";
    },
    [domainStatuses, verifyingDomains, isInitialized]
  );

  return (
    <DomainStatusContext.Provider
      value={{
        domainStatuses,
        setDomainStatus,
        verifyingDomains,
        setVerifyingDomain,
        getOverallStatus,
      }}
    >
      {children}
    </DomainStatusContext.Provider>
  );
}

export function useDomainStatus() {
  const context = useContext(DomainStatusContext);
  if (context === undefined) {
    throw new Error(
      "useDomainStatus must be used within a DomainStatusProvider"
    );
  }
  return context;
}
