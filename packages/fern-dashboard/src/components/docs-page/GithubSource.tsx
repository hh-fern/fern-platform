"use client";

import { useEffect } from "react";
import { useState } from "react";

import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { Cog, Loader2, Lock } from "lucide-react";

import { FernTooltip, FernTooltipProvider } from "@fern-docs/components";
import { getLoadableValue } from "@fern-ui/loadable";

import { Auth0SessionData } from "@/app/services/auth0/getCurrentSession";
import { Auth0OrgName } from "@/app/services/auth0/types";
import { getRepoDisplayNameFromUrl } from "@/app/services/github/github";
import { useGithubSourceRepo } from "@/state/useGithubSourceRepo";
import { DocsUrl } from "@/utils/types";

import { GithubLogo } from "../auth/GithubLogo";
import { Button } from "../ui/button";
import { useGithubPermissions } from "./GithubPermissionsContext";
import { GoToEditorButton } from "./GoToEditorButton";
import { SetGithubSourcePopover } from "./SetGithubSource";

export function GithubSource({
  docsUrl,
  orgName,
  session,
  githubUrl,
}: {
  docsUrl: DocsUrl;
  orgName: Auth0OrgName;
  session: Auth0SessionData;
  githubUrl?: string;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { writePermission } = useGithubPermissions();

  const githubSource = getLoadableValue(useGithubSourceRepo(githubUrl));

  useEffect(() => {
    if (!githubSource) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [githubSource]);

  const [isDomainHovered, setIsDomainHovered] = useState(false);

  const disabled =
    isLoading ||
    (githubSource && !githubSource.fernBotHasInstallationId) ||
    !writePermission;

  return (
    <>
      <div
        className="flex flex-wrap items-center gap-2"
        onMouseEnter={() => setIsDomainHovered(true)}
      >
        <div className="flex items-center gap-2">
          {githubUrl ? (
            <>
              <GithubLogo />
              <a href={githubUrl} className="dashboard-link" target="_blank">
                <span className="truncate">
                  {getRepoDisplayNameFromUrl(githubUrl)}
                </span>
              </a>
              {isDomainHovered && (
                <SetGithubSourcePopover
                  docsUrl={docsUrl}
                  setIsSaving={setIsSaving}
                >
                  <Button
                    size={isSaving ? "sm" : "iconSm"}
                    variant="ghost"
                    disabled={isSaving}
                    className="size-4 p-0"
                  >
                    {isSaving ? <Loader2 className="animate-spin" /> : <Cog />}
                  </Button>
                </SetGithubSourcePopover>
              )}
            </>
          ) : (
            <SetGithubSourcePopover docsUrl={docsUrl} setIsSaving={setIsSaving}>
              <Button size="sm" className="w-fit" disabled={isSaving}>
                <GithubLogo />
                {isSaving ? "Saving..." : "Connect Repo"}
              </Button>
            </SetGithubSourcePopover>
          )}
        </div>
      </div>

      <div className="flex flex-row items-center gap-2">
        <GoToEditorButton
          orgName={orgName}
          docsUrl={docsUrl}
          session={session}
          sourceRepo={githubSource}
          isValidatingSource={isLoading}
          disabled={disabled}
        />
        {/* Handle displaying reason for disabling GoToEditor button */}

        {!isLoading && disabled && (
          <>
            {githubSource && !githubSource.fernBotHasInstallationId ? (
              <FernTooltipProvider>
                <FernTooltip
                  content="fern-bot is not installed on this repository"
                  variant="dashboard"
                  delayDuration={0}
                  side="bottom"
                  className="bg-gray-1200 rounded-md text-white"
                >
                  <ExclamationCircleIcon className="size-6 text-red-600" />
                </FernTooltip>
              </FernTooltipProvider>
            ) : !writePermission ? (
              <FernTooltipProvider>
                <FernTooltip
                  content="You do not have write permission to this repository."
                  variant="dashboard"
                  delayDuration={0}
                  side="bottom"
                  className="bg-gray-1200 rounded-md text-white"
                >
                  <Lock className="text-muted-foreground size-4" />
                </FernTooltip>
              </FernTooltipProvider>
            ) : (
              <></>
            )}
          </>
        )}
      </div>
    </>
  );
}
