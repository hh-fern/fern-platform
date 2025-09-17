"use client";

import { forwardRef } from "react";

import { type VariantProps, cva } from "class-variance-authority";
import { useAtom, useAtomValue } from "jotai";
import { Search } from "lucide-react";

import { AlgoliaSearchClientRoot } from "@fern-docs/search-ui/components/search/algolia-search-client";
import { DesktopSearchDialog } from "@fern-docs/search-ui";
import { useLazyRef } from "@fern-ui/react-commons";

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


const searchButtonVariants = cva(
  "fixed bottom-6 right-6 z-50 rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-105 focus:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
        dark: "bg-gray-800 text-white hover:bg-gray-700 focus:ring-gray-500",
        minimal:
          "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-300",
      },
      size: {
        default: "h-14 w-14",
        sm: "h-12 w-12 p-3",
        lg: "h-16 w-16 p-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface SearchButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof searchButtonVariants> {
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

export const SearchModal = forwardRef<HTMLButtonElement, SearchButtonProps>(
  ({ className, variant, size, icon, ...props }, ref) => {

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
        <DesktopSearchDialog open={open} onOpenChange={setOpen}>

          <DesktopCommandWithAskAI
            askAI={false}
            defaultAskAI={false}
            setAskAI={() => false}
            domain={domain}
            // api?: string;
            // suggestionsApi?: string;
            // body?: object;
            // headers?: Record<string, string>;
            // initialInput?: string;
            // chatId?: string;
            // onSelectHit?: (path: string) => void;
            // prefetch?: (path: string) => Promise<void>;
            // composerActions?: ReactNode;
            // domain: string;
            // renderActions?: (message: SqueezedMessage) => ReactNode;
            // setInitialInput?: (initialInput: string) => void;
            // children?: ReactNode;
            // darkCodeEnabled?: boolean;
            useConversationId={() => conversationIdHook}
          />
        </DesktopSearchDialog>
      </AlgoliaSearchClientRoot>
    );
  }
);
SearchModal.displayName = "SearchButton";
