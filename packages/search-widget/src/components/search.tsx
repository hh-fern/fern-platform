"use client";

import { forwardRef } from "react";
import React from "react";

import { atom, useAtom, useAtomValue } from "jotai";
import z from "zod";

import {
  CommandEmpty,
  CommandGroupFilters,
  CommandSearchHits,
  DefaultDesktopBackButton,
  DesktopSearchDialog,
} from "@fern-docs/search-ui";
import { AskAiStandaloneModal } from "@fern-docs/search-ui/components/desktop/ask-ai-modal";
import { AlgoliaSearchClientRoot } from "@fern-docs/search-ui/components/search/algolia-search-client";
import { useLazyRef } from "@fern-ui/react-commons";

import { useApiRoute } from "@/hooks/useApiRoute";
import { useApiRouteSWRImmutable } from "@/hooks/useApiRouteSWR";
import { searchDialogOpenAtom, useConversationId } from "@/state/search";
import { generateQueryId } from "@/utils/generateQueryId";

import "../styles/desktop.scss";
import { atomWithStorageString } from "../utils/atomWithStorageString";

export const SEARCH_INDEX = "fern_docs_search";
export const DOMAIN = "http://localhost:3001";

const ApiKeySchema = z.object({
  appId: z.string(),
  apiKey: z.string(),
});

export const askAIAtom = atom(false);

export interface SearchButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
}

const ALGOLIA_USER_TOKEN_KEY = "algolia-user-token";

export function useAlgoliaUserToken() {
  const userTokenRef = useLazyRef(() =>
    atomWithStorageString(
      ALGOLIA_USER_TOKEN_KEY,
      `anonymous-user-${crypto.randomUUID()}`,
      { getOnInit: true }
    )
  );
  return useAtomValue(userTokenRef.current);
}

export const queryIdAtom = atom<string>(generateQueryId());
export function useQueryId() {
  const [queryId, setQueryId] = useAtom(queryIdAtom);
  return {
    queryId,
    setQueryId,
    resetQueryId: () => setQueryId(generateQueryId()),
  };
}

export const SearchModal = forwardRef<HTMLButtonElement, SearchButtonProps>(
  ({ className, icon, ...props }, ref) => {
    const userToken = useAlgoliaUserToken();
    const conversationIdHook = useConversationId();
    const [open, setOpen] = useAtom(searchDialogOpenAtom);
    const [askAI, setAskAI] = useAtom(askAIAtom);

    const queryIdHook = useQueryId();

    const { data } = useApiRouteSWRImmutable(
      `/api/fern-docs/search/v2/key`,
      DOMAIN,
      {
        request: { headers: { "X-User-Token": userToken } },
        validate: ApiKeySchema,
        // api key expires 24 hours, so we refresh it every hour
        refreshInterval: 60 * 60 * 1000,
        preload: true,
      }
    );

    let chatEndpoint = useApiRoute(`/api/fern-docs/search/v2/chat`, DOMAIN);
    let suggestionsEndpoint = useApiRoute(
      `/api/fern-docs/search/v2/suggest`,
      DOMAIN
    );
    const facetApiEndpoint = useApiRoute(
      `/api/fern-docs/search/v2/facet`,
      DOMAIN
    );

    const facetFetcher = React.useCallback(
      async (filters: readonly string[]) => {
        if (!data) {
          return {};
        }
        const searchParams = new URLSearchParams();
        searchParams.append("apiKey", data.apiKey);
        filters.forEach((filter) => searchParams.append("filters", filter));
        const search = String(searchParams);
        const res = await fetch(`${facetApiEndpoint}?${search}`, {
          method: "GET",
        });
        return res.json();
      },
      [data, facetApiEndpoint]
    );

    if (!data) {
      return null;
    }

    const { apiKey, appId } = data;

    const children = (
      <>
        <DefaultDesktopBackButton />
        <CommandGroupFilters />
        <CommandEmpty />
        <CommandSearchHits
          onSelect={() => {}}
          prefetch={(path) => {}}
          domain={DOMAIN}
          forceWindowOpen={true}
        />
      </>
    );

    return (
      <AlgoliaSearchClientRoot
        appId={appId}
        apiKey={apiKey}
        domain={DOMAIN}
        indexName={SEARCH_INDEX}
        fetchFacets={facetFetcher}
        initialFilters={undefined}
        analyticsTags={["search-v2-dialog"]}
      >
        <DesktopSearchDialog open={open} onOpenChange={setOpen}>
          <AskAiStandaloneModal
            useConversationId={() => conversationIdHook}
            useQueryId={() => queryIdHook}
            domain={DOMAIN}
            askAI={askAI}
            setAskAI={setAskAI}
            api={chatEndpoint}
            body={{ algoliaSearchKey: apiKey }}
            suggestionsApi={suggestionsEndpoint}
          >
            {children}
          </AskAiStandaloneModal>
        </DesktopSearchDialog>
      </AlgoliaSearchClientRoot>
    );
  }
);
SearchModal.displayName = "SearchButton";
