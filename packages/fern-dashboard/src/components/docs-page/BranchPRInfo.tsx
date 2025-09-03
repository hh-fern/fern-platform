"use client";

import { GitPRProvider, useGitPrInfo } from "@/providers/GitPRContext";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { GithubSourceRepo } from "@/app/services/github/types";
import { GithubLogo } from "../auth/GithubLogo";

interface BranchPRInfoProps {
  branch: string;
  sourceRepo?: GithubSourceRepo;
  onBranchClick: (branchName: string) => void;
}

function BranchPRContent({ branch, onBranchClick }: { branch: string; onBranchClick: (branchName: string) => void }) {
  const { prTitle, gitPrUrl, prStatus, loading } = useGitPrInfo();

  const displayName = prTitle || branch;
  const isClickable = !!gitPrUrl;

  const handleClick = () => {
    if (isClickable) {
      window.open(gitPrUrl, '_blank');
    } else {
      onBranchClick(branch);
    }
  };

  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <GithubLogo />
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 bg-gray-400 rounded animate-pulse w-50"></div>
              <div className="h-6 bg-gray-400 rounded-full animate-pulse w-20"></div>
            </div>
          ) : (
            <>
              <button
                onClick={handleClick}
                className={`text-sm font-medium text-gray-900 truncate ${
                  isClickable 
                    ? 'text-blue-600 hover:text-blue-800 hover:underline cursor-pointer' 
                    : 'cursor-pointer'
                }`}
                title={isClickable ? `Open PR in GitHub: ${displayName}` : `Resume editing: ${displayName}`}
              >
                {displayName}
              </button>
              {prTitle ? (
                <StatusBadge status={prStatus ?? "draft"} />
              ) : (
                <StatusBadge status="uncommitted" />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function BranchPRInfo({ branch, sourceRepo, onBranchClick }: BranchPRInfoProps) {
  if (!sourceRepo?.owner || !sourceRepo?.repo) {
    return (
      <div className="flex items-center justify-between py-3">
        <div className="flex-1 min-w-0">
          <p className="flex items-center gap-2 text-sm font-medium text-gray-900 truncate">
            <GithubLogo />
            {branch}
          </p>
        </div>
      </div>
    );
  }

  return (
    <GitPRProvider
      owner={sourceRepo.owner}
      repo={sourceRepo.repo}
      branch={branch}
      baseBranch={sourceRepo.baseBranch}
    >
      <BranchPRContent branch={branch} onBranchClick={onBranchClick} />
    </GitPRProvider>
  );
}
