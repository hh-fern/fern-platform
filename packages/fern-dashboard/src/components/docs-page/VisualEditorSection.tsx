"use client";

import { useEffect, useState } from "react";

import { Auth0SessionData } from "@/app/services/auth0/getCurrentSession";
import { getRelevantBranches } from "@/app/services/github/branch-utils";
import {
  GithubRepoValidationError,
} from "@/app/services/dal/github/validators";
import { GithubLogo } from "@/components/auth/GithubLogo";
import { GithubSourceRepo } from "@/app/services/github/types";
import { DocsUrl } from "@/utils/types";
import { Button } from "@/components/ui/button";
import Card from "@/components/ui/card";
import { WarningNote } from "./WarningNote";
import { VEPreviewImage } from "./VEPreviewImage";
import { GoToEditorButton } from "./GoToEditorButton";
import { OpenPRsComponent } from "./OpenPRsComponent";
import { GithubAuthState } from "./GithubSource";

interface ValidationErrorHandlerProps {
  error: GithubRepoValidationError;
  githubUrl?: string;
}

function ValidationErrorHandler({
  error,
  githubUrl,
}: ValidationErrorHandlerProps) {
  switch (error.type) {
    case "FERN_BOT_NOT_INSTALLED":
      return (
        <>
          <p className="text-muted-foreground text-sm">
            To get started, install the Fern app on your GitHub repository.
          </p>
          <Button asChild>
            <a
              href="https://github.com/apps/fern-api"
              target="_blank"
              rel="noopener noreferrer"
            >
              <GithubLogo />
              Install
            </a>
          </Button>
        </>
      );

    case "MALFORMED_GITHUB_URL":
      return (
        <WarningNote>
          This repo was not found. Please check that the repo exists and that
          you have access to it.
        </WarningNote>
      );

    case "FERN_CONFIG_JSON_MISSING":
      return (
        <WarningNote>
          Your repository is missing a <code>fern.config.json</code> file.
          Please ensure your Fern project is properly configured.
          {githubUrl && (
            <>
              {" "}
              Check your repository{" "}
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary underline transition-colors"
              >
                here
              </a>
              .
            </>
          )}
        </WarningNote>
      );

    case "FERN_CONFIG_JSON_MALFORMED":
      return (
        <WarningNote>
          Your <code>fern.config.json</code> file is malformed. Please check the
          file syntax and ensure it follows the correct format.
          {githubUrl && (
            <>
              {" "}
              Check your repository{" "}
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary underline transition-colors"
              >
                here
              </a>
              .
            </>
          )}
        </WarningNote>
      );

    case "FERN_CONFIG_JSON_ORG_MISMATCH":
      return (
        <WarningNote>
          The organization in your <code>fern.config.json</code> file does not
          match your current organization.
        </WarningNote>
      );

    case "UNEXPECTED_ERROR":
      return (
        <WarningNote>
          {
            "An unexpected error occurred while attempting to access to this repository. Please try again or contact support if the issue persists."
          }
        </WarningNote>
      );

    default:
      return (
        <WarningNote>
          We were unable to validate access to this repo. Please try again or
          contact support if the issue persists.
        </WarningNote>
      );
  }
}

export function VisualEditorSection({
  docsUrl,
  session,
  githubAuthState,
  githubUrl,
}: {
  docsUrl: DocsUrl;
  session: Auth0SessionData;
  githubAuthState: GithubAuthState;
  githubUrl?: string;
}) {
  const [hasRelevantBranches, setHasRelevantBranches] = useState<boolean | null>(null);

  // Check if user has relevant branches on client side
  useEffect(() => {
    const relevantBranches = getRelevantBranches(session.user.sub);
    setHasRelevantBranches(relevantBranches.length > 0);
  }, [session.user.sub]);

  // Loading state
  if (hasRelevantBranches === null) {
    return (
      <Card className="relative flex h-[300px] flex-col-reverse gap-0 !p-0 lg:flex-row">
        <div className="lg:max-w-1/2 h-full w-full">
          <VEPreviewImage className="h-full w-full" />
        </div>
        <div className="flex flex-col items-center justify-center gap-4 p-6 md:flex-1 lg:items-start">
          <div className="flex flex-col items-center lg:items-start">
            <p className="text-lg font-semibold">Fern Visual Editor</p>
            <p className="text-muted-foreground text-sm">
              Modify your documentation without touching code.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (hasRelevantBranches) {
    return (
      <OpenPRsComponent
        docsUrl={docsUrl}
        session={session}
        sourceRepo={githubAuthState.sourceRepo}
      />
    );
  }

  return (
    <Card className="relative flex h-[300px] flex-col-reverse gap-0 !p-0 lg:flex-row">
      <div className="lg:max-w-1/2 h-full w-full">
        <VEPreviewImage className="h-full w-full" />
      </div>
      <div className="flex flex-col items-center justify-center gap-4 p-6 md:flex-1 lg:items-start">
        <div className="flex flex-col items-center lg:items-start">
          <p className="text-lg font-semibold">Fern Visual Editor</p>
          <p className="text-muted-foreground text-sm">
            Modify your documentation without touching code.
          </p>
          {githubUrl == null && (
            <p className="text-muted-foreground text-sm">
              Connect your repository above to get started.
            </p>
          )}
        </div>

        {githubUrl != null &&
          (githubAuthState.validationResult.ok ? (
            <>
              <GoToEditorButton
                docsUrl={docsUrl}
                session={session}
                sourceRepo={githubAuthState.sourceRepo}
              />
              <p className="text-muted-foreground text-sm">
                All sessions will turn into PRs in your Github repo{" "}
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary underline transition-colors"
                >
                  here
                </a>
                .
              </p>
            </>
          ) : (
            <ValidationErrorHandler
              error={githubAuthState.validationResult.error}
              githubUrl={githubUrl}
            />
          ))}
      </div>
    </Card>
  );
}
