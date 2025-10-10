/**
 * Re-export fernShiki with docs-specific configuration
 * This maintains backward compatibility while using the shared package
 */

import {
    getHighlighterInstance as getHighlighterInstanceBase,
    useHighlightTokens as useHighlightTokensBase,
    useHighlighter as useHighlighterBase,
    highlightTokens,
    trimCode,
    parseLang,
    createRawTokens,
    type HighlightedTokens
} from "@fern-api/syntax-highlighter";
import { isLocal } from "../util/isLocal";
import { isSelfHosted } from "../util/isSelfHosted";

// Determine if we should enable memoization based on environment
const isLocalOrSelfHostedEnv = isLocal() || isSelfHosted();

/**
 * Get the highlighter instance with docs-specific configuration
 */
export const getHighlighterInstance = () =>
    getHighlighterInstanceBase({
        enableMemoization: !isLocalOrSelfHostedEnv
    });

/**
 * Hook to highlight tokens with docs-specific configuration
 */
export function useHighlightTokens() {
    return useHighlightTokensBase({
        enableMemoization: !isLocalOrSelfHostedEnv
    });
}

/**
 * Hook to get highlighter instance with docs-specific configuration
 */
export function useHighlighter(lang: string) {
    return useHighlighterBase(lang, {
        enableMemoization: !isLocalOrSelfHostedEnv
    });
}

// Re-export utility functions
export { highlightTokens, trimCode, parseLang, createRawTokens };
export type { HighlightedTokens };
