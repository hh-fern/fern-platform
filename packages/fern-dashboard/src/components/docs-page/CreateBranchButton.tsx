import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCallback } from "react";

import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { Auth0SessionData } from "@/app/services/auth0/getCurrentSession";
import { Auth0OrgName } from "@/app/services/auth0/types";
import { DashboardApiClient } from "@/app/services/dashboard-api/client";
import { DocsUrl } from "@/utils/types";

import { Button } from "../ui/button";

export function CreateBranchButton({
  orgName,
  docsUrl,
  session,
  sourceRepo,
  disabled = false,
  disabledReason,
}: {
  orgName: Auth0OrgName;
  docsUrl: DocsUrl;
  session: Auth0SessionData;
  sourceRepo: any;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const createBranch = useCallback(async () => {
    if (sourceRepo?.owner == null || sourceRepo.repo == null) {
      return;
    }
    const randomHexString = crypto.randomUUID().split("-")[0];

    const branchName =
      new Date().toISOString().split("T")[0] +
      "-" +
      session.user.name?.toLowerCase().replace(" ", "_") +
      "-" +
      randomHexString;

    const response = await DashboardApiClient.postCreateBranch({
      owner: sourceRepo.owner,
      repo: sourceRepo.repo,
      branch: branchName,
      baseBranch: sourceRepo.baseBranch ?? "main",
    });
    if (response.success === false) {
      toast.error("Failed to create branch");
      setIsLoading(false);
      return;
    }
    router.push(`/${orgName}/editor/${docsUrl}/${branchName}/root`);
    setIsLoading(false);
  }, [sourceRepo, session.user.name, orgName, docsUrl, router]);

  return (
    <div className="flex flex-row gap-1">
      <Button
        size="sm"
        className={`w-fit ${disabled ? "bg-red-500 text-white hover:bg-red-600" : ""}`}
        onClick={() => {
          if (!disabled) {
            setIsLoading(true);
            void createBranch();
          }
        }}
        disabled={isLoading || disabled}
      >
        Go to Editor
        <ArrowRight />
      </Button>
      {disabled && disabledReason && (
        <div className="flex items-center gap-2 text-red-600">
          <ExclamationCircleIcon className="h-4 w-4" />
          <p className="text-xs">{disabledReason}</p>
        </div>
      )}
    </div>
    // NOTE: This is the UI we want when we have a way to preview branches.
    // <Button
    //   variant="outline"
    //   size="sm"
    //   className="text-primary hover:text-primary"
    //   onClick={() => {
    //     setIsLoading(true);
    //     void createBranch();
    //   }}
    //   disabled={isLoading}
    // >
    //   <PencilSquareIcon className="text-primary" />
    //   Create a Branch
    // </Button>
  );
}
