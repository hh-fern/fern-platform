"use client";

import { useMemo } from "react";
import { getLoadableValue } from "@fern-ui/loadable";

import { useDocsSite } from "@/state/useMyDocsSites";
import { DocsUrl } from "@/utils/types";
import { useDomainStatus } from "@/state/useDomainStatus";
import { useOrgNameFromPathname } from "@/utils/useOrgNameFromPathname";
import { cn } from "@/utils/utils";

import Card from "../ui/card";
import { DocsSiteLink } from "./DocsSiteLink";
import { DocsSiteImage } from "./docs-site-image/DocsSiteImage";
import { SkeletonDocsSiteImage } from "./docs-site-image/SkeletonDocsSiteImage";
import { DomainConfigurationCard } from "./DomainConfigurationCard";

export declare namespace DocsSiteOverviewCard {
  export interface Props {
    docsUrl: DocsUrl;
    githubProtectedArea: React.ReactNode;
  }
}

interface DomainWithStatusProps {
  domain: string;
  path?: string;
  isDomainSetupEnabled: boolean;
  domainStatuses: Record<string, any>;
}

function DomainWithStatus({ domain, path, isDomainSetupEnabled, domainStatuses }: DomainWithStatusProps) {
  const fullDomain = `${domain}${path || ''}`;
  
  // For non-enabled orgs or Fern subdomains, just show the regular link
  if (!isDomainSetupEnabled || domain.includes('buildwithfern.com')) {
    return <DocsSiteLink docsSiteUrl={{ domain, path: path || '' }} />;
  }

  // For custom domains in enabled orgs, show status
  const status = domainStatuses[domain];
  const getStatusDisplay = () => {
    if (!status) return { text: "Configuring...", color: "text-blue-600" };
    if (status.status === 'ready') return null; // No status shown for ready domains
    if (status.status === 'error') return { text: "Error", color: "text-red-600" };
    if (status.status === 'verifying') return { text: "Verifying...", color: "text-blue-600" };
    return null;
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="flex items-center gap-2">
      <DocsSiteLink docsSiteUrl={{ domain, path: path || '' }} />
      {statusDisplay && (
        <span className={cn("text-xs px-2 py-1 rounded-full", statusDisplay.color, 
          statusDisplay.color === "text-yellow-600" ? "bg-yellow-100 dark:bg-yellow-900/30" :
          statusDisplay.color === "text-blue-600" ? "bg-blue-100 dark:bg-blue-900/30" :
          statusDisplay.color === "text-red-600" ? "bg-red-100 dark:bg-red-900/30" :
          "bg-gray-100 dark:bg-gray-700"
        )}>
          {statusDisplay.text}
        </span>
      )}
    </div>
  );
}

export function DocsSiteOverviewCard({
  docsUrl,
  githubProtectedArea,
}: DocsSiteOverviewCard.Props) {
  const docsSite = getLoadableValue(useDocsSite(docsUrl));
  const { domainStatuses } = useDomainStatus();
  const orgName = useOrgNameFromPathname();

  // TEMPORARY: Only enable for plantman org during testing
  const isDomainSetupEnabled = orgName === "plantman";

  return (
    <div className="flex w-full flex-col gap-4">
      <Card className="flex flex-col md:flex-row">
        {docsSite != null ? (
          <DocsSiteImage docsSite={docsSite} />
        ) : (
          <SkeletonDocsSiteImage />
        )}
        {docsSite != null && (
          <div className="flex min-w-0 flex-col gap-4 text-gray-900">
            <div className="flex flex-col gap-2">
              <p>Domains</p>
              <div className="flex flex-col items-start gap-1">
                {docsSite.urls.map((url) => (
                  <DomainWithStatus
                    key={`${url.domain}${url.path}`}
                    domain={url.domain}
                    path={url.path}
                    isDomainSetupEnabled={isDomainSetupEnabled}
                    domainStatuses={domainStatuses}
                  />
                ))}
              </div>
            </div>
            {githubProtectedArea}
          </div>
        )}
      </Card>

      {/* Domain Configuration Card - shows when domains need DNS setup */}
      <DomainConfigurationCard docsUrl={docsUrl} />

      {/* 
      TODO: Add open branches here once we have a way to preview branches
      {sourceRepo?.repoName != null && sourceRepo.owner != null && (
        <Card className="flex flex-col gap-2">
          <div className="flex flex-row items-center justify-between">
            <p>
              <b>Open Pull Requests</b>
            </p>
            <GithubProtectedButton
              orgName={orgName}
              docsUrl={docsUrl}
              session={session}
              sourceRepo={sourceRepo}
              hasRepoAccess={hasRepoAccess}
            />
          </div>
          <p className="text-gray-1100 text-sm">TODO: List PRs</p>
        </Card>
      )} */}
    </div>
  );
}
