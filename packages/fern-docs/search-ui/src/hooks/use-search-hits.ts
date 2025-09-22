/* eslint-disable react-hooks/rules-of-hooks */
import { useDeferredValue } from "react";
import { useHits, useInfiniteHits } from "react-instantsearch";

import type { InfiniteHitsRenderState } from "instantsearch.js/es/connectors/infinite-hits/connectInfiniteHits";
import type { SendEventForHits } from "instantsearch.js/es/lib/utils";

import { isSelfHosted } from "@fern-api/docs-server";
import type { AlgoliaRecord } from "@fern-docs/search-keyword/types";

import type { AlgoliaRecordHit } from "../types";
import {
  useMeilisearchHits,
  useMeilisearchInfiniteHits,
  useMeilisearchSendEvent,
} from "./meilisearch/use-infinite-hits";

export function useSearchHits(): AlgoliaRecordHit[] {
  if (isSelfHosted()) {
    return useDeferredValue(useMeilisearchHits());
  }
  const { items } = useHits<AlgoliaRecord>();
  return useDeferredValue(items);
}

export function useSendEvent(): SendEventForHits {
  if (isSelfHosted()) {
    return useMeilisearchSendEvent();
  }
  const { sendEvent } = useHits();
  return sendEvent;
}

export function useInfiniteSearchHits(): InfiniteHitsRenderState<AlgoliaRecord> {
  if (isSelfHosted()) {
    return useMeilisearchInfiniteHits();
  }
  return useInfiniteHits<AlgoliaRecord>();
}
