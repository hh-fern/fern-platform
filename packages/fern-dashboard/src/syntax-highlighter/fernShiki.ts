/**
 * Re-export fernShiki with dashboard-specific configuration
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

/**
 * Get the highlighter instance with dashboard-specific configuration
 * Dashboard always uses memoization
 */
export const getHighlighterInstance = () =>
    getHighlighterInstanceBase({
        enableMemoization: true
    });

/**
 * Hook to highlight tokens
 */
export function useHighlightTokens() {
    return useHighlightTokensBase({
        enableMemoization: true
    });
}

/**
 * Hook to get highlighter instance
 */
export function useHighlighter(lang: string) {
    return useHighlighterBase(lang, {
        enableMemoization: true
    });
}

// Re-export utility functions
export { highlightTokens, trimCode, parseLang, createRawTokens };
export type { HighlightedTokens };
