"use client";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@radix-ui/react-dialog";
import { MessageSquare, Search, X } from "lucide-react";

import { FacetFilter } from "@fern-docs/search-keyword";
import { AlgoliaSearchClientRoot } from "@fern-docs/search-ui/src/components/search/algolia-search-client";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChat: () => void;
  algoliaConfig: {
    appId: string;
    apiKey: string;
    indexName: string;
    domain: string;
  };
  fetchFacets?: (filters: readonly string[]) => Promise<any>;
  initialFilters?: Partial<Record<string, string>>;
}

export function SearchModal({
  isOpen,
  onClose,
  onOpenChat,
  algoliaConfig,
  fetchFacets,
  initialFilters,
}: SearchModalProps) {
  const [query, setQuery] = useState("");

  const handleOpenChat = () => {
    onClose();
    onOpenChat();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 sm:p-6">
        <div className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-xl">
          <DialogHeader className="flex items-center justify-between border-b p-4">
            <DialogTitle className="text-lg font-semibold">
              Search Documentation
            </DialogTitle>
            <button
              onClick={onClose}
              className="rounded-full p-2 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </button>
          </DialogHeader>

          <div className="p-4">
            {/* Search Input */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search documentation..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>

            {/* Ask AI Button */}
            <div className="mb-4">
              <button
                onClick={handleOpenChat}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
              >
                <MessageSquare className="h-4 w-4" />
                Ask AI
              </button>
            </div>

            {/* Search Results */}
            <div className="max-h-96 overflow-y-auto">
              {fetchFacets ? (
                <AlgoliaSearchClientRoot
                  appId={algoliaConfig.appId}
                  apiKey={algoliaConfig.apiKey}
                  indexName={algoliaConfig.indexName}
                  domain={algoliaConfig.domain}
                  fetchFacets={fetchFacets}
                  initialFilters={initialFilters}
                >
                  <SearchResults query={query} />
                </AlgoliaSearchClientRoot>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  Configure search to see results
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Placeholder component for search results
// TODO: Replace with actual search results component from @fern-docs/search-ui
function SearchResults({ query }: { query: string }) {
  return (
    <div className="space-y-2">
      {query ? (
        <div className="text-gray-500">
          Search results for "{query}" would appear here
        </div>
      ) : (
        <div className="text-gray-500">Start typing to search...</div>
      )}
    </div>
  );
}
