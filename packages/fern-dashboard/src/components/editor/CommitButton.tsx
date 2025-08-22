"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  // New architecture only
  CommitOrchestrator,
} from "@fern-docs/components";

import { DashboardApiClient } from "@/app/services/dashboard-api/client";
import {
  DEFAULT_COMMIT_MESSAGE,
  handleCreatePr,
} from "@/app/services/github/github";
import { useEditingDisabled } from "@/hooks/useEditingDisabled";
import { useBranch } from "@/providers/BranchContext";
import { useGitHubRepo } from "@/providers/GitHubRepoContext";
import { useGitPrInfo } from "@/providers/GitPRContext";
import { useMdxState } from "@/providers/MdxStateContext";
import {
  addPageToDocsYml,
  parseYaml,
  removePageFromDocsYml,
} from "@/utils/docsYmlUpdater";

import { GithubLogo } from "../auth/GithubLogo";
import { Button } from "../ui/button";
import { DashboardTooltip } from "./DashboardTooltip";
import {
  ErrorNoBaseBranchToast,
  ErrorNoBranchToast,
  ErrorNoGithubSourceToast,
  SuccessfulCommitToast,
  WarningNoChangesToast,
} from "./EditorToasts";
import { ErrorFullCommitToast } from "./EditorToasts";

// GitHub API adapter for new architecture
const githubApi = {
  async createCommit(request: any) {
    return DashboardApiClient.postGitCommit({
      owner: request.owner,
      repo: request.repo,
      branch: request.branch,
      message: request.message,
      files: request.files,
    });
  },
};

// Docs.yml updater adapter for new architecture
const docsYmlUpdater = {
  addPageToDocsYml,
  removePageFromDocsYml,
  parseYaml,
};

// Initialize the new architecture components
const commitOrchestrator = new CommitOrchestrator(githubApi, docsYmlUpdater);

/**
 * Generates a hash from commit plan with consistent ordering
 * @param commitPlan - CommitPlan from new architecture
 * @returns Hash string representing the commit plan
 */
function generateCommitPlanHash(commitPlan: any): string {
  const filesToCommit: Record<string, string> = {};
  for (const [path, content] of commitPlan.filesToCommit || []) {
    filesToCommit[path] = content;
  }

  if (commitPlan.docsYmlContent) {
    filesToCommit["docs.yml"] = commitPlan.docsYmlContent;
  }

  const sortedKeys = Object.keys(filesToCommit).sort();
  const sortedChanges: Record<string, string> = {};
  sortedKeys.forEach((key) => {
    const value = filesToCommit[key];
    if (value !== undefined) {
      sortedChanges[key] = value;
    }
  });

  const changeString = JSON.stringify({
    files: sortedChanges,
    deletions: commitPlan.filesToDelete?.sort() || [],
  });
  let hash = 0;
  for (let i = 0; i < changeString.length; i++) {
    const char = changeString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
}

export function CommitButton() {
  const { gitPrUrl, setPrUrl, prTitle, refetchPrData } = useGitPrInfo();
  const { branch } = useBranch();
  const isEditingDisabled = useEditingDisabled();
  const { owner, repo, baseBranch } = useGitHubRepo();

  // Use shared document changes system from MdxStateContext
  const { documentChanges } = useMdxState();
  const { changeSet, hasChanges, getCommitPlan, isLoading } = documentChanges;

  useEffect(() => {
    // NOTE: This is a temporary solution to persist the PR URL across route changes/refreshes.
    const prUrl = localStorage.getItem(`gitPrUrl-${branch}`);
    if (prUrl) {
      setPrUrl(prUrl);
    }
  }, [branch, setPrUrl]);

  const [isCommitting, setIsCommitting] = useState(false);
  const [changesCommitted, setChangesCommitted] = useState(false);

  // Initialize changesCommitted state based on new architecture
  useEffect(() => {
    if (!branch || !changeSet) return;

    const commitPlan = getCommitPlan();
    const currentHash = generateCommitPlanHash(commitPlan);
    const lastCommittedHash = localStorage.getItem(
      `lastCommittedHash-${branch}`
    );

    // Only set changesCommitted to true if:
    // 1. We have a stored committed hash
    // 2. Current changes hash matches the committed hash
    // 3. There are actually some changes (hash is not for empty state)
    if (
      lastCommittedHash &&
      currentHash === lastCommittedHash &&
      currentHash !== "0"
    ) {
      setChangesCommitted(true);
    } else {
      setChangesCommitted(false);
    }
  }, [changeSet, branch, getCommitPlan]);

  const handleCommitPress = useCallback(async () => {
    if (!owner || !repo) {
      ErrorNoGithubSourceToast();
      return;
    }
    if (!branch) {
      ErrorNoBranchToast();
      return;
    }
    if (!changeSet) {
      WarningNoChangesToast();
      return;
    }

    const commitPlan = getCommitPlan();
    if (!commitPlan.hasChanges) {
      WarningNoChangesToast();
      return;
    }

    setIsCommitting(true);
    try {
      // Use the new CommitOrchestrator
      const result = await commitOrchestrator.commit(changeSet, {
        owner,
        repo,
        branch,
        message: DEFAULT_COMMIT_MESSAGE,
        pathPrefix: "fern/",
      });

      if (result.success) {
        SuccessfulCommitToast();
        setChangesCommitted(true);

        // Store the hash of committed changes
        const committedHash = generateCommitPlanHash(commitPlan);
        localStorage.setItem(`lastCommittedHash-${branch}`, committedHash);
      } else {
        ErrorFullCommitToast();
      }

      if (result.success && !gitPrUrl) {
        if (!baseBranch) {
          ErrorNoBaseBranchToast();
          return;
        }
        const newPrUrl = await handleCreatePr({
          branch,
          owner,
          repo,
          baseBranch,
          title: prTitle,
          onAiGenerationComplete: refetchPrData,
        });
        if (newPrUrl) {
          setPrUrl(newPrUrl);
          localStorage.setItem(`gitPrUrl-${branch}`, newPrUrl);
        }
      }
    } catch (error) {
      ErrorFullCommitToast();
      console.error("Error committing changes:", error);
    } finally {
      setIsCommitting(false);
    }
  }, [
    branch,
    changeSet,
    getCommitPlan,
    gitPrUrl,
    setPrUrl,
    prTitle,
    refetchPrData,
    owner,
    repo,
    baseBranch,
  ]);

  const commitDisabledReason = useMemo(() => {
    if (isEditingDisabled) {
      return "Cannot commit when PR is closed or merged";
    }

    if (isCommitting) {
      return "Disabled while committing";
    }

    if (isLoading) {
      return "Loading changes...";
    }

    if (!hasChanges()) {
      return "No changes to commit";
    }

    if (changesCommitted) {
      return "Latest changes have been committed";
    }

    return null;
  }, [
    isEditingDisabled,
    isCommitting,
    isLoading,
    hasChanges,
    changesCommitted,
  ]);

  return (
    <DashboardTooltip content={commitDisabledReason}>
      <Button
        loading={isCommitting}
        disabled={!!commitDisabledReason}
        onClick={() => void handleCommitPress()}
      >
        <GithubLogo />
        Commit
      </Button>
    </DashboardTooltip>
  );
}
