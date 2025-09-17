"use client";

import "../styles/modal-container.css";
import "../styles/search-results.css";
import "../styles/esc-button.css";

import { forwardRef } from "react";

import { useAtom, useAtomValue } from "jotai";

import { AlgoliaSearchClientRoot } from "@fern-docs/search-ui/components/search/algolia-search-client";
import { DesktopSearchDialog } from "@fern-docs/search-ui";
import { useLazyRef } from "@fern-ui/react-commons";
import * as Dialog from "@radix-ui/react-dialog";
import { TooltipPortal } from "@radix-ui/react-tooltip";
import { Button } from "@fern-docs/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@fern-docs/search-ui/components/ui/tooltip";

import { useApiRouteSWRImmutable } from "@/hooks/useApiRouteSWR";
import { atomWithStorageString } from "../utils/atomWithStorageString";
import { useApiRoute } from "@/hooks/useApiRoute";
import React from "react";
import z from "zod";
import { DesktopCommandWithAskAI } from "./search-modal";
import { useConversationId, searchDialogOpenAtom } from "@/state/search";

export const SEARCH_INDEX = "fern_docs_search";
export const domain = "buildwithfern.com/learn";

const ApiKeySchema = z.object({
  appId: z.string(),
  apiKey: z.string(),
});

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

function EscButton({ className }: { className?: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Dialog.DialogClose asChild>
            <Button
              size="xs"
              variant="outline"
              className={className}
              aria-label="Close search"
            >
              <kbd>Esc</kbd>
            </Button>
          </Dialog.DialogClose>
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipContent>
            <p>Close search</p>
          </TooltipContent>
        </TooltipPortal>
      </Tooltip>
    </TooltipProvider>
  );
}

export const SearchModal = forwardRef<HTMLButtonElement, SearchButtonProps>(
  ({ className, icon, ...props }, ref) => {

    const userToken = useAlgoliaUserToken();
    const conversationIdHook = useConversationId();
    const [open, setOpen] = useAtom(searchDialogOpenAtom);
  

    // const { data } = useApiRouteSWRImmutable(`${domain}/api/fern-docs/search/v2/key`, {
    //   request: { headers: { "X-User-Token": userToken } },
    //   validate: ApiKeySchema,
    //   // api key expires 24 hours, so we refresh it every hour
    //   refreshInterval: 60 * 60 * 1000,
    //   preload: true,
    // });

    // if (!data) {
    //   return null;
    // }

    const { apiKey, appId } = data;

    let chatEndpoint = useApiRoute(`${domain}/api/fern-docs/search/v2/chat`);
    let suggestEndpoint = useApiRoute(`${domain}/api/fern-docs/search/v2/suggest`);
    const facetApiEndpoint = useApiRoute(`${domain}/api/fern-docs/search/v2/facet`);

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

    return (
      <AlgoliaSearchClientRoot
        appId={appId}
        apiKey={apiKey}
        domain={domain}
        indexName={SEARCH_INDEX}
        fetchFacets={facetFetcher}
        initialFilters={undefined}
        analyticsTags={["search-v2-dialog"]}
      >
        <DesktopSearchDialog
          open={open}
          onOpenChange={setOpen}
          afterInput={<EscButton />}
        >
          <DesktopCommandWithAskAI
            askAI={false}
            setAskAI={() => false}
            domain={domain}
            useConversationId={() => conversationIdHook}
          />
        </DesktopSearchDialog>
      </AlgoliaSearchClientRoot>
    );
  }
);
SearchModal.displayName = "SearchButton";
