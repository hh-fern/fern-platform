import type { Root } from "hast";

export interface HighlightedTokens {
    code: string;
    lang: string;
    hast: Root;
}

export interface FernShikiOptions {
    /**
     * Whether to enable memoization of the highlighter instance
     * Set to false for local/self-hosted environments
     */
    enableMemoization?: boolean;

    /**
     * Additional languages to load beyond Shiki's bundled languages
     */
    additionalLanguages?: Record<string, () => Promise<any>>;

    /**
     * Template variables to highlight specially
     */
    templateVariables?: Set<string>;
}
