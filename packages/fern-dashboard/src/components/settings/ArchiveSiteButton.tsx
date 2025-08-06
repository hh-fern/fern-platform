"use client";

import { useState } from "react";

import { useRouter } from "@bprogress/next/app";
import { toast } from "sonner";

import { archiveSite } from "@/app/actions/archiveSite";
import { delay } from "@/utils/delay";
import { DocsUrl } from "@/utils/types";
import { useOrgNameFromPathname } from "@/utils/useOrgNameFromPathname";

import { INVALIDATE_DOCS_QUERY_KEY } from "../docs-page/MaybeInvalidateDocsSiteQuery";
import { Button } from "../ui/button";
import { FernLogger } from "@/utils/logging/logger";
import { DashboardError } from "@/utils/logging/errors";

export declare namespace ArchiveSiteButton {
  export interface Props {
    docsUrl: DocsUrl;
  }
}

export function ArchiveSiteButton({ docsUrl }: ArchiveSiteButton.Props) {
  const [isArchiving, setIsArchiving] = useState(false);
  const orgName = useOrgNameFromPathname();
  const router = useRouter();

  const archive = async () => {
    setIsArchiving(true);
    try {
      await Promise.all([
        archiveSite({ url: docsUrl }),
        // so the loading state shows for at least a second
        delay(1_000),
      ]);
      toast.success(<div className="truncate">Archived {docsUrl}</div>);
      router.push(`/${orgName}/docs?${INVALIDATE_DOCS_QUERY_KEY}=true`);
    } catch (e) {
      FernLogger.error(DashboardError.FAILED_TO_ARCHIVE_SITE, e, {
        docsUrl,
        orgName
      });
      toast.error("Failed to archive site");
      setIsArchiving(false);
    }
  };

  return (
    <Button
      variant="destructive"
      onClick={() => {
        void archive();
      }}
      loading={isArchiving}
    >
      Archive site
    </Button>
  );
}
