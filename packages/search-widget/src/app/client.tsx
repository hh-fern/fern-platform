"use client";

import { SearchModal } from "@/components/search";
import { SearchWidgetTrigger } from "@/state/search";

export function TestPageClient() {
  return (
    <div className="flex min-h-screen items-end justify-end bg-gray-50 pr-4 pb-4">
      <SearchWidgetTrigger />
      <SearchModal />
    </div>
  );
}
