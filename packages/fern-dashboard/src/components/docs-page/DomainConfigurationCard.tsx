"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

import { getLoadableValue } from "@fern-ui/loadable";
import { useCopyToClipboard } from "@fern-ui/react-commons";

import { Button } from "@/components/ui/button";
import Card from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDomainStatus } from "@/state/useDomainStatus";
import { useDocsSite } from "@/state/useMyDocsSites";
import { DocsUrl } from "@/utils/types";
import { useOrgNameFromPathname } from "@/utils/useOrgNameFromPathname";

interface DomainConfigurationCardProps {
  docsUrl: DocsUrl;
}

interface DNSRecord {
  type: string;
  name: string;
  value: string;
}

interface DomainStatusResponse {
  status: "ready" | "needs_dns" | "error";
  message?: string;
  instructions?: string[];
}

interface AddDomainResult {
  success: boolean;
  domain?: any;
  isNew: boolean;
}

export function DomainConfigurationCard({
  docsUrl,
}: DomainConfigurationCardProps) {
  const docsSite = getLoadableValue(useDocsSite(docsUrl));
  const {
    domainStatuses,
    verifyingDomains,
    setVerifyingDomain,
    setDomainStatus,
  } = useDomainStatus();
  const orgName = useOrgNameFromPathname();
  const [autoVerifyAttempted, setAutoVerifyAttempted] = useState<Set<string>>(
    new Set()
  );

  // TEMPORARY: Only enable for plantman org during testing
  const isDomainSetupEnabled = orgName === "plantman";

  // Get all custom domains for auto-verification
  const customDomains = useMemo(() => {
    if (!isDomainSetupEnabled || !docsSite?.urls) return [];
    return docsSite.urls.filter(
      (url) => !url.domain.includes("buildwithfern.com")
    );
  }, [isDomainSetupEnabled, docsSite]);

  // Get custom domains that need DNS configuration for display
  const domainsNeedingConfiguration = useMemo(() => {
    return customDomains.filter((urlObj) => {
      const domain = urlObj.domain;
      const status = domainStatuses[domain];

      // Show configuration for:
      // 1. Domains that need DNS setup
      // 2. Domains with errors (so user can retry)
      // 3. Domains without status yet (new domains)
      // 4. Subpaths that are not verified (show contact support message)
      return (
        (status?.status === "needs_dns" && status.instructions) ||
        status?.status === "error" ||
        !status ||
        (urlObj.path && urlObj.path !== "" && status?.status !== "ready")
      );
    });
  }, [customDomains, domainStatuses]);

  const addDomainToVercel = useCallback(
    async (domainName: string): Promise<AddDomainResult> => {
      try {
        const response = await fetch("/api/vercel/add-domain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domain: domainName }),
        });

        const result = await response.json();

        if (!response.ok) {
          if (result.error?.code === "domain_already_in_use") {
            return {
              success: true,
              domain: result.error.domain,
              isNew: false,
            };
          }
          throw new Error(result.error?.message || "Failed to add domain");
        }

        return { success: true, domain: result, isNew: true };
      } catch (_error: any) {
        console.error("Error adding domain:", _error);
        return { success: false, isNew: false };
      }
    },
    []
  );

  const checkDomainStatus = useCallback(
    async (domainName: string): Promise<DomainStatusResponse> => {
      try {
        const response = await fetch(
          `/api/vercel/domain-status?domain=${encodeURIComponent(domainName)}`
        );
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to check domain status");
        }

        return result;
      } catch (_error: any) {
        console.error("Error checking domain status:", _error);
        return {
          status: "error",
          message: _error.message || "Failed to check domain status",
        };
      }
    },
    []
  );

  const handleVerifyDomain = useCallback(
    async (domainName: string, silent = false) => {
      setVerifyingDomain(domainName, true);

      try {
        // First add domain to Vercel
        const addResult = await addDomainToVercel(domainName);

        if (!addResult.success) {
          if (!silent) {
            toast.error(
              `Failed to configure ${domainName}. Please try again later.`
            );
          }
          setDomainStatus(domainName, {
            status: "error",
            message: "Failed to add domain to Vercel",
          });
          return;
        }

        // Wait a moment for the domain to be processed
        await new Promise((resolve) =>
          setTimeout(resolve, addResult.isNew ? 3000 : 1000)
        );

        // Check domain status
        const status = await checkDomainStatus(domainName);
        setDomainStatus(domainName, status);

        if (status.status === "ready") {
          if (!silent) {
            toast.success(`${domainName} is ready to use!`);
          }
        } else if (status.status === "needs_dns" && status.instructions) {
          if (!silent) {
            toast.warning(
              `${domainName} requires DNS configuration. Please add the records shown below.`
            );
          }
        } else if (status.status === "error") {
          if (!silent) {
            toast.error(`Error configuring ${domainName}: ${status.message}`);
          }
        }
      } catch (_error: any) {
        console.error("Error in handleVerifyDomain:", _error);

        // For silent mode (auto-verification), don't set error state immediately
        // Let the user manually retry instead
        if (silent) {
          console.log(
            `Auto-verification failed for ${domainName}, but not setting error state`
          );
          return;
        }

        if (!silent) {
          toast.error("An unexpected error occurred. Please try again.");
        }
        setDomainStatus(domainName, {
          status: "error",
          message: "Network error occurred",
        });
      } finally {
        setVerifyingDomain(domainName, false);
      }
    },
    [addDomainToVercel, checkDomainStatus, setDomainStatus, setVerifyingDomain]
  );

  // Auto-verify new domains when they appear (only for enabled orgs)
  const autoVerifyNewDomains = useCallback(async () => {
    if (!isDomainSetupEnabled || !customDomains.length) return;

    // Find domains that need auto-verification
    const domainsToVerify = customDomains.filter((urlObj) => {
      const domain = urlObj.domain;
      const existingStatus = domainStatuses[domain];

      // Skip if we've already attempted auto-verification recently
      if (autoVerifyAttempted.has(domain)) {
        return false;
      }

      // For ready/live domains, check much less frequently (every 24 hours)
      if (existingStatus?.status === "ready") {
        const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
        if (
          existingStatus.timestamp &&
          existingStatus.timestamp > twentyFourHoursAgo
        ) {
          setAutoVerifyAttempted((prev) => new Set([...prev, domain]));
          return false; // Skip - checked recently and was good
        }
        // If it's been 24+ hours, include it for a silent health check
        return true;
      }

      // Skip if domain has DNS instructions (user should handle manually)
      if (
        existingStatus?.status === "needs_dns" &&
        existingStatus.instructions
      ) {
        setAutoVerifyAttempted((prev) => new Set([...prev, domain]));
        return false;
      }

      // For non-ready domains, check less frequently (every 1 hour)
      if (
        existingStatus?.timestamp &&
        Date.now() - existingStatus.timestamp < 60 * 60 * 1000
      ) {
        setAutoVerifyAttempted((prev) => new Set([...prev, domain]));
        return false;
      }

      return true;
    });

    if (domainsToVerify.length === 0) return;

    // Silently verify domains without visual spam
    const readyDomains = domainsToVerify.filter(
      (d) => domainStatuses[d.domain]?.status === "ready"
    );
    const newDomains = domainsToVerify.filter(
      (d) =>
        !domainStatuses[d.domain] ||
        domainStatuses[d.domain]?.status !== "ready"
    );

    if (readyDomains.length > 0) {
      console.log(
        `🔍 Health checking ${readyDomains.length} live domain(s): ${readyDomains.map((d) => d.domain).join(", ")}`
      );
    }
    if (newDomains.length > 0) {
      console.log(
        `🔍 Auto-verifying ${newDomains.length} new domain(s): ${newDomains.map((d) => d.domain).join(", ")}`
      );
    }

    for (const urlObj of domainsToVerify) {
      const domain = urlObj.domain;
      const wasReady = domainStatuses[domain]?.status === "ready";

      // Mark as attempted to prevent repeated auto-verification
      setAutoVerifyAttempted((prev) => new Set([...prev, domain]));

      // For ready domains, do a health check - only update status if there's actually a problem
      if (wasReady) {
        try {
          const status = await checkDomainStatus(domain);
          if (status.status === "ready") {
            // Domain is still good, just update timestamp
            setDomainStatus(domain, { ...status, timestamp: Date.now() });
          } else {
            // Domain has an issue, update status to reflect the problem
            console.log(
              `⚠️ Live domain ${domain} now has issues: ${status.status}`
            );
            setDomainStatus(domain, status);
          }
        } catch (_error) {
          // Health check failed, mark as error
          console.log(`❌ Health check failed for ${domain}`);
          setDomainStatus(domain, {
            status: "error",
            message: "Domain health check failed",
            timestamp: Date.now(),
          });
        }
      } else {
        // New or problematic domain - do full verification
        await handleVerifyDomain(domain, true); // true = silent mode, no notifications
      }

      // Add a small delay between domains to avoid overwhelming the API
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log(`✅ Auto-verification completed silently`);
  }, [
    isDomainSetupEnabled,
    customDomains,
    autoVerifyAttempted,
    domainStatuses,
    handleVerifyDomain,
    checkDomainStatus,
    setDomainStatus,
  ]);

  // Auto-verify when custom domains are detected (only for enabled orgs)
  useEffect(() => {
    if (isDomainSetupEnabled && customDomains.length > 0) {
      void autoVerifyNewDomains();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDomainSetupEnabled, customDomains.length]);

  // Parse DNS records from instructions
  const getDnsRecords = (domain: string): DNSRecord[] => {
    const status = domainStatuses[domain];
    if (!status?.instructions) return [];

    return status.instructions.map((instruction) => {
      if (instruction.includes("TXT record")) {
        const match = instruction.match(
          /Add TXT record for (.+) with value: (.+)/
        );
        return {
          type: "TXT",
          name: match?.[1] || "_vercel",
          value: match?.[2] || "",
        };
      } else if (instruction.includes("CNAME record")) {
        const match = instruction.match(
          /Add CNAME record for (.+) with value: (.+)/
        );
        return {
          type: "CNAME",
          name: match?.[1] || "docs",
          value: match?.[2] || "cname.vercel-dns.com.",
        };
      }
      return { type: "TXT", name: "", value: instruction };
    });
  };

  const handleManualVerifyDomain = async (domain: string) => {
    await handleVerifyDomain(domain, false); // false = show notifications
  };

  // Don't show the card if no domains need configuration
  if (domainsNeedingConfiguration.length === 0) {
    return null;
  }

  return (
    <Card className="border-green-300 bg-green-100 p-6 dark:border-green-800 dark:bg-green-900/10">
      {domainsNeedingConfiguration.map((urlObj) => {
        const domain = urlObj.domain;
        const dnsRecords = getDnsRecords(domain);
        const isVerifying = verifyingDomains.has(domain);
        const status = domainStatuses[domain];

        // Determine what to show based on status
        const getContent = () => {
          // Check if this is a subpath (has a path component)
          const isSubpath = urlObj.path && urlObj.path !== "";

          if (isSubpath && status?.status !== "ready") {
            return {
              title: `${domain}${urlObj.path}`,
              description: "Custom subpaths require additional configuration.",
              showDnsTable: false,
              buttonText: "Contact Support",
              showInstructions: false,
              isSubpath: true,
            };
          }

          if (status?.status === "error") {
            return {
              title: `${domain} - Configuration Error`,
              description:
                status.message ||
                "Failed to configure domain. Please try again.",
              showDnsTable: false,
              buttonText: "Retry Configuration",
              showInstructions: false,
              isSubpath: false,
            };
          } else if (status?.status === "needs_dns" && status.instructions) {
            return {
              title: domain,
              description:
                "Verification required. Visit the admin console of your domain registrar (the website you bought your domain from) and create the DNS Records shown below. Note that it may take up to a few hours for the DNS changes to propagate.",
              showDnsTable: true,
              buttonText: "Verify Domain",
              showInstructions: true,
              isSubpath: false,
            };
          } else {
            // New domain or unknown status
            return {
              title: domain,
              description: "Setting up domain configuration...",
              showDnsTable: false,
              buttonText: "Configure Domain",
              showInstructions: false,
              isSubpath: false,
            };
          }
        };

        const content = getContent();

        // Copy button component for DNS records
        const CopyButton = ({ value }: { value: string }) => {
          const { copyToClipboard, wasJustCopied } = useCopyToClipboard(
            () => value
          );

          return (
            <button
              onClick={() => void copyToClipboard?.()}
              className="ml-2 rounded p-1 transition-colors hover:bg-gray-200 dark:hover:bg-gray-600"
              title={wasJustCopied ? "Copied!" : "Copy to clipboard"}
            >
              {wasJustCopied ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <Copy className="h-3 w-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" />
              )}
            </button>
          );
        };

        return (
          <div key={domain} className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  <Image
                    src="/favicon.ico"
                    alt="Domain"
                    width={20}
                    height={20}
                    className="opacity-70"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3
                      className="text-lg font-semibold"
                      style={{ color: "var(--radix-green-11, #008700)" }}
                    >
                      {content.title}
                    </h3>
                  </div>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--radix-gray-9, #8B8D98)" }}
                  >
                    {content.description}
                  </p>
                  {content.isSubpath && (
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: "var(--radix-gray-9, #8B8D98)" }}
                    >
                      Setting up a custom subpath?{" "}
                      <a
                        href="#"
                        className="font-medium text-blue-700 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Book a call
                      </a>{" "}
                      or contact support.
                    </p>
                  )}
                </div>
              </div>
              <Button
                onClick={() =>
                  content.isSubpath
                    ? window.open("#", "_blank")
                    : handleManualVerifyDomain(domain)
                }
                disabled={isVerifying}
                loading={isVerifying}
                variant="outline"
                size="sm"
                className="shrink-0 border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
              >
                {isVerifying ? "Verifying..." : content.buttonText}
              </Button>
            </div>

            {/* DNS Records Table */}
            {content.showDnsTable && dnsRecords.length > 0 && (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm dark:border-green-800/50 dark:bg-gray-950">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-gray-200 bg-gray-100 dark:border-green-800/50 dark:bg-green-950/30">
                        <TableHead
                          className="font-semibold"
                          style={{ color: "var(--radix-green-11, #008700)" }}
                        >
                          Type
                        </TableHead>
                        <TableHead
                          className="font-semibold"
                          style={{ color: "var(--radix-green-11, #008700)" }}
                        >
                          Name
                        </TableHead>
                        <TableHead
                          className="font-semibold"
                          style={{ color: "var(--radix-green-11, #008700)" }}
                        >
                          Value
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dnsRecords.map((record, index) => (
                        <TableRow
                          key={index}
                          className="border-b border-gray-100 dark:border-gray-800/50"
                        >
                          <TableCell
                            className="font-mono text-sm font-medium"
                            style={{ color: "var(--radix-gray-9, #8B8D98)" }}
                          >
                            {record.type}
                          </TableCell>
                          <TableCell
                            className="font-mono text-sm"
                            style={{ color: "var(--radix-gray-9, #8B8D98)" }}
                          >
                            <div className="flex items-center">
                              <code
                                className="break-all rounded border bg-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-700"
                                style={{
                                  color: "var(--radix-gray-9, #8B8D98)",
                                }}
                              >
                                {record.name}
                              </code>
                              <CopyButton value={record.name} />
                            </div>
                          </TableCell>
                          <TableCell
                            className="font-mono text-sm"
                            style={{ color: "var(--radix-gray-9, #8B8D98)" }}
                          >
                            <div className="flex items-center">
                              <code
                                className="break-all rounded border bg-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-700"
                                style={{
                                  color: "var(--radix-gray-9, #8B8D98)",
                                }}
                              >
                                {record.value}
                              </code>
                              <CopyButton value={record.value} />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </Card>
  );
}
