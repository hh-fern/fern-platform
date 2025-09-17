"use client";

import { SearchModal } from "@/components/search";
import { SearchWidgetTrigger } from "@/state/search";

export function TestPageClient() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <SearchWidgetTrigger />
      <SearchModal />
    </div>
  );
}
