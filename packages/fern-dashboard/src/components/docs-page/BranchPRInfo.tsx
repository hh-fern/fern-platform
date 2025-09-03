"use client";

import { useState } from "react";

import { Trash2 } from "lucide-react";

import { GithubSourceRepo } from "@/app/services/github/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GitPRProvider, useGitPrInfo } from "@/providers/GitPRContext";
import { getUncommittedChangesState } from "@/utils/uncommitted-changes-storage";

import { GithubLogo } from "../auth/GithubLogo";

interface BranchPRInfoProps {
  branch: string;
  sourceRepo?: GithubSourceRepo;
  onBranchClick: (branchName: string) => void;
  onBranchDelete: (branchName: string) => void;
}

function BranchPRContent({
  branch,
  onBranchClick,
  onBranchDelete,
}: {
  branch: string;
  onBranchClick: (branchName: string) => void;
  onBranchDelete: (branchName: string) => void;
}) {
  const { prTitle, gitPrUrl, prStatus, loading } = useGitPrInfo();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const hasUncommittedChanges = getUncommittedChangesState(branch);

  const displayName = prTitle || branch;
  const isClickable = !!gitPrUrl;

  const handleClick = () => {
    if (isClickable) {
      window.open(gitPrUrl, "_blank");
    } else {
      onBranchClick(branch);
    }
  };

  const handleDeleteClick = () => {
    const hasCommittedChanges = prTitle || prStatus;
    const hasChanges = hasCommittedChanges || hasUncommittedChanges;

    if (hasChanges) {
      setShowDeleteDialog(true);
    } else {
      onBranchDelete(branch);
    }
  };

  const handleConfirmDelete = () => {
    onBranchDelete(branch);
    setShowDeleteDialog(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
  };

  const getDialogMessage = () => {
    if (hasUncommittedChanges && prStatus) {
      return "This session has both committed changes and uncommitted local changes. Are you sure you want to remove it?";
    } else if (hasUncommittedChanges) {
      return "This session has uncommitted local changes. You will lose your changes -  are you sure?";
    } else if (prStatus) {
      console.log("prStatus", prStatus);
      return "This session has committed changes. Are you sure you want to remove it?";
    }
    return "Are you sure you want to remove this branch?";
  };

  return (
    <div className="flex items-center justify-between py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <GithubLogo />
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-50 flex h-4 animate-pulse items-center justify-center rounded bg-gray-400"></div>
              <div className="h-6 w-20 animate-pulse rounded-full bg-gray-400"></div>
            </div>
          ) : (
            <>
              <button
                onClick={handleClick}
                className={`truncate text-sm font-medium text-gray-900 ${
                  isClickable
                    ? "cursor-pointer text-blue-600 hover:text-blue-800 hover:underline"
                    : "cursor-pointer"
                }`}
                title={
                  isClickable
                    ? `Open PR in GitHub: ${displayName}`
                    : `Resume editing: ${displayName}`
                }
              >
                {displayName}
              </button>
              {prTitle && prStatus && <StatusBadge status={prStatus} />}
              {hasUncommittedChanges && <StatusBadge status="uncommitted" />}
            </>
          )}
        </div>
      </div>
      <button
        onClick={handleDeleteClick}
        className="ml-2 rounded p-1 text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
        title={`Delete local data for ${branch}`}
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
            <div className="flex flex-col gap-6">   {/* adds vertical spacing */}
            <DialogHeader>
              <DialogTitle>Delete Session</DialogTitle>
              <DialogDescription>{getDialogMessage()}</DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button variant="outline" onClick={handleCancelDelete}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete}>
                Delete
              </Button>
            </DialogFooter>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function BranchPRInfo({
  branch,
  sourceRepo,
  onBranchClick,
  onBranchDelete,
}: BranchPRInfoProps) {
  if (!sourceRepo?.owner || !sourceRepo?.repo) {
    return null;
  }

  return (
    <GitPRProvider
      owner={sourceRepo.owner}
      repo={sourceRepo.repo}
      branch={branch}
      baseBranch={sourceRepo.baseBranch}
    >
      <BranchPRContent
        branch={branch}
        onBranchClick={onBranchClick}
        onBranchDelete={onBranchDelete}
      />
    </GitPRProvider>
  );
}
