"use client";

import { getLoadableValue } from "@fern-ui/loadable";

import { useDomainStatus } from "@/state/useDomainStatus";
import { useDocsSite } from "@/state/useMyDocsSites";
import { DocsUrl } from "@/utils/types";
import { useOrgNameFromPathname } from "@/utils/useOrgNameFromPathname";
import { cn } from "@/utils/utils";

import Card from "../ui/card";
import { DocsSiteLink } from "./DocsSiteLink";
import { DomainConfigurationCard } from "./DomainConfigurationCard";
import { DocsSiteImage } from "./docs-site-image/DocsSiteImage";
import { SkeletonDocsSiteImage } from "./docs-site-image/SkeletonDocsSiteImage";

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

function DomainWithStatus({
  domain,
  path,
  isDomainSetupEnabled,
  domainStatuses,
}: DomainWithStatusProps) {
  // For non-enabled orgs or Fern subdomains, just show the regular link
  if (!isDomainSetupEnabled || domain.includes("buildwithfern.com")) {
    return <DocsSiteLink docsSiteUrl={{ domain, path: path || "" }} />;
  }



  return (
    <div className="flex items-center gap-2">
      <DocsSiteLink docsSiteUrl={{ domain, path: path || "" }} />
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
