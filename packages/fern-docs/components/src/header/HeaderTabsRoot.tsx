"use client";

import * as Tabs from "@radix-ui/react-tabs";

import { cn } from "@fern-api/docs-utils/cn";

import { useCurrentTabId } from "../utils/navigation";

export function HeaderTabsRoot({
  children,
  showSearchBar,
  className,
}: {
  children: React.ReactNode;
  showSearchBar: boolean;
  className?: string;
}) {
  const currentTabId = useCurrentTabId();
  return (
    <Tabs.Root
      value={currentTabId}
      className={cn("fern-header-tabs", className)}
    >
      {children}
      {showSearchBar && (
        <SearchV2Trigger
          aria-label="Search"
          className="max-w-sidebar-width overflow-hidden"
          isSearchInSidebar={false}
        />
      )}
    </Tabs.Root>
  );
}
