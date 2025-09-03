"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ArrowRight } from "lucide-react";

import { useOrgName } from "@/app/[orgName]/context/OrgNameContext";
import { Auth0SessionData } from "@/app/services/auth0/getCurrentSession";
import { GithubSourceRepo } from "@/app/services/github/types";
import { Button } from "@/components/ui/button";
import Card from "@/components/ui/card";
import { deleteLocalBranch } from "@/utils/branch-utils.client";
import { ROOT_SLUG_ALIAS, constructEditorSlug } from "@/utils/editor-routing";
import { DocsUrl, EncodedDocsUrl } from "@/utils/types";

import { BranchPRInfo } from "./BranchPRInfo";
import { GoToEditorButton } from "./GoToEditorButton";

export function OpenPRsComponent({
  docsUrl,
  session,
  sourceRepo,
  branches,
}: {
  docsUrl: DocsUrl;
  session: Auth0SessionData;
  sourceRepo?: GithubSourceRepo;
  branches: string[];
}) {
  const orgName = useOrgName();
  const router = useRouter();

  // Pagination state
  const [visibleCount, setVisibleCount] = useState(3);
  const [deletedBranches, setDeletedBranches] = useState<Set<string>>(
    new Set()
  );
  const BRANCHES_PER_PAGE = 3;

  const handleBranchClick = (branchName: string) => {
    const editorSlug = constructEditorSlug({
      orgName,
      docsUrl: encodeURIComponent(docsUrl) as EncodedDocsUrl,
      branchName,
      slug: ROOT_SLUG_ALIAS,
    });
    router.push(editorSlug);
  };

  const handleBranchDelete = (branchName: string) => {
    deleteLocalBranch(branchName);
    setDeletedBranches((prev) => new Set(prev).add(branchName));
    const remainingBranches = branches.filter(
      (branch) => !deletedBranches.has(branch)
    );
    if (visibleCount > remainingBranches.length) {
      setVisibleCount(remainingBranches.length);
    }
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) =>
      Math.min(prev + BRANCHES_PER_PAGE, availableBranches.length)
    );
  };

  // Filter out deleted branches and get the branches to display (first N branches)
  const availableBranches = branches.filter(
    (branch) => !deletedBranches.has(branch)
  );
  const visibleBranches = availableBranches.slice(0, visibleCount);
  const hasMoreBranches = visibleCount < availableBranches.length;

  return (
    <Card>
      <div className="flex w-full flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3
            className="dark:text-gray-1200 text-black"
            style={{
              fontFamily: "var(--font-gt-planar)",
              fontWeight: 700,
              fontSize: "16px",
              lineHeight: "20px",
            }}
          >
            Fern Visual Editor
          </h3>
          <GoToEditorButton
            docsUrl={docsUrl}
            session={session}
            sourceRepo={sourceRepo}
          />
        </div>

        {availableBranches.length > 0 && (
          <div className="space-y-0">
            {visibleBranches.map((branch, index) => (
              <div key={branch}>
                <div className="flex items-center justify-between">
                  <BranchPRInfo
                    branch={branch}
                    sourceRepo={sourceRepo}
                    onBranchClick={handleBranchClick}
                    onBranchDelete={handleBranchDelete}
                  />
                  <Button
                    size="sm"
                    onClick={() => handleBranchClick(branch)}
                    className="text-green-1100 ml-3 border border-gray-400 bg-white hover:border-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-300 dark:text-green-900 dark:hover:border-gray-500 dark:hover:bg-gray-400"
                    style={{
                      fontFamily: "var(--font-gt-planar)",
                      fontWeight: 400,
                      fontSize: "12px",
                      lineHeight: "20px",
                    }}
                  >
                    Open
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
                {index < visibleBranches.length - 1 && (
                  <div className="border-b border-gray-400 dark:border-gray-600" />
                )}
              </div>
            ))}

            {hasMoreBranches && (
              <div className="pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadMore}
                  style={{
                    fontFamily: "var(--font-gt-planar)",
                    fontWeight: 400,
                    fontSize: "12px",
                    lineHeight: "20px",
                  }}
                >
                  Load More ({availableBranches.length - visibleCount}{" "}
                  remaining)
                </Button>
              </div>
            )}
          </div>
        )}

        {availableBranches.length === 0 && (
          <div className="py-8 text-center">
            <p
              className="dark:text-gray-1200 text-gray-500"
              style={{
                fontFamily: "var(--font-gt-planar)",
                fontWeight: 400,
                fontSize: "14px",
                lineHeight: "20px",
              }}
            >
              No open sessions found
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
