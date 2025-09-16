"use client";

import { useState } from "react";

import { ChatModal } from "./ChatModal";
import { SearchButton, type SearchButtonProps } from "./SearchButton";
import { SearchModal } from "./SearchModal";

export interface SearchWidgetConfig {
  domain: string;
  apiEndpoint?: string;
  algolia: {
    appId: string;
    apiKey: string;
    indexName: string;
  };
  systemPrompt?: string;
  fetchFacets?: (filters: readonly string[]) => Promise<any>;
  initialFilters?: Partial<Record<string, string>>;
}

export interface SearchWidgetProps extends SearchWidgetConfig {
  buttonProps?: Omit<SearchButtonProps, "onClick">;
}

export function SearchWidget({
  domain,
  apiEndpoint,
  algolia,
  systemPrompt,
  fetchFacets,
  initialFilters,
  buttonProps,
}: SearchWidgetProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleOpenSearch = () => {
    setIsSearchOpen(true);
  };

  const handleCloseSearch = () => {
    setIsSearchOpen(false);
  };

  const handleOpenChat = () => {
    setIsChatOpen(true);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
  };

  const handleBackToSearch = () => {
    setIsChatOpen(false);
    setIsSearchOpen(true);
  };

  return (
    <>
      <SearchButton onClick={handleOpenSearch} {...buttonProps} />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={handleCloseSearch}
        onOpenChat={handleOpenChat}
        algoliaConfig={{
          ...algolia,
          domain,
        }}
        fetchFacets={fetchFacets}
        initialFilters={initialFilters}
      />

      <ChatModal
        isOpen={isChatOpen}
        onClose={handleCloseChat}
        onBack={handleBackToSearch}
        apiEndpoint={apiEndpoint}
        domain={domain}
        systemPrompt={systemPrompt}
      />
    </>
  );
}

// Export individual components for more granular usage
export { SearchButton, SearchModal, ChatModal };
export type { SearchButtonProps };
