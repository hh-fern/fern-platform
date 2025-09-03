"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useOrgName } from "@/app/[orgName]/context/OrgNameContext";
import { Auth0SessionData } from "@/app/services/auth0/getCurrentSession";
import { getRelevantBranches } from "@/utils/branch-utils";
import { GithubSourceRepo } from "@/app/services/github/types";
import { constructEditorSlug, ROOT_SLUG_ALIAS } from "@/utils/editor-routing";
import { DocsUrl, EncodedDocsUrl } from "@/utils/types";
import { Button } from "@/components/ui/button";
import { GoToEditorButton } from "./GoToEditorButton";

export function OpenPRsComponent({
  docsUrl,
  session,
  sourceRepo,
}: {
  docsUrl: DocsUrl;
  session: Auth0SessionData;
  sourceRepo?: GithubSourceRepo;
}) {
  const orgName = useOrgName();
  const router = useRouter();
  const [branches, setBranches] = useState<string[]>([]);

  useEffect(() => {
    const relevantBranches = getRelevantBranches(session.user.sub);
    setBranches(relevantBranches);
  }, [session.user.sub]);

  const handleBranchClick = (branchName: string) => {
    const editorSlug = constructEditorSlug({
      orgName,
      docsUrl: encodeURIComponent(docsUrl) as EncodedDocsUrl,
      branchName,
      slug: ROOT_SLUG_ALIAS,
    });
    router.push(editorSlug);
  };

  return (
    <div className="border-border flex min-w-0 flex-1 gap-6 rounded-xl border bg-white p-3 transition-[padding] sm:p-4 md:p-5 lg:p-6">
      <div className="flex w-full flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-black">Fern Visual Editor</h3>
          <GoToEditorButton
            docsUrl={docsUrl}
            session={session}
            sourceRepo={sourceRepo}
          />
        </div>
        
        {branches.length > 0 && (
          <div className="space-y-0">
            {branches.map((branch, index) => (
              <div key={branch}>
                <div className="flex items-center justify-between py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {branch}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleBranchClick(branch)}
                    className="ml-3 bg-white hover:bg-gray-50 text-green-1000 border border-gray-400 hover:border-gray-600"
                  >
                    Open
                  </Button>
                </div>
                {index < branches.length - 1 && (
                  <div className="border-b border-gray-200" />
                )}
              </div>
            ))}
          </div>
        )}
        
        {branches.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">No open sessions found</p>
          </div>
        )}
      </div>
    </div>
  );
}
