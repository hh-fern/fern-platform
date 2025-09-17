"use client";

import { DesktopSearchDialog } from "@fern-docs/search-ui";

import { SearchWidgetTrigger, useIsSearchDialogOpen, useSetSearchDialogOpen } from "../state/search";

export function TestPageClient() {
  const isModalOpen = useIsSearchDialogOpen();
  const setIsModalOpen = useSetSearchDialogOpen();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <SearchWidgetTrigger />

      <DesktopSearchDialog
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        trigger={<div />}
      >
      </DesktopSearchDialog>
    </div>
  );
}