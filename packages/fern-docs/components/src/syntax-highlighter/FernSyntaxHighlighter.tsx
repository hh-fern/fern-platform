"use client";

import { forwardRef, useEffect, useMemo } from "react";

import { EMPTY_OBJECT } from "@fern-api/ui-core-utils";
import { useDeepCompareMemoize } from "@fern-ui/react-commons";

import {
  FernSyntaxHighlighterTokens,
  ScrollToHandle,
} from "./FernSyntaxHighlighterTokens";
import { FernSyntaxHighlighterTokensVirtualized } from "./FernSyntaxHighlighterTokensVirtualized";
import { createRawTokens, highlightTokens, useHighlighter } from "./fernShiki";
import { TemplateTooltip } from "./template-tooltip";

// [number, number] is a range of lines to highlight
type HighlightLine = number | [number, number];

export interface FernSyntaxHighlighterProps {
  className?: string;
  style?: React.CSSProperties;
  id?: string;
  code: string;
  language: string;
  fontSize?: "sm" | "base" | "lg";
  highlightLines?: HighlightLine[];
  highlightStyle?: "highlight" | "focus";
  viewportRef?: React.RefObject<ScrollToHandle | null>;
  maxLines?: number;
  wordWrap?: boolean;
  template?: Record<string, string>;
  tooltips?: Record<string, React.ReactNode>;
  initialScrollToLine?: number;
}

export const FernSyntaxHighlighter = forwardRef<
  HTMLPreElement,
  FernSyntaxHighlighterProps
>((props, ref) => {
  const {
    code,
    language,
    tooltips,
    template,
    initialScrollToLine,
    ...innerProps
  } = props;
  const highlighter = useHighlighter(language);

  const variableNames = useDeepCompareMemoize(
    new Set([
      ...Object.keys(tooltips ?? EMPTY_OBJECT),
      ...Object.keys(template ?? EMPTY_OBJECT),
    ])
  );

  const tokens = useMemo(() => {
    if (highlighter == null) {
      return createRawTokens(code, language);
    }
    try {
      return highlightTokens(highlighter, code, language, variableNames);
    } catch (e) {
      // TODO: sentry

      console.error("Error occurred while highlighting tokens", e);
      return createRawTokens(code, language);
    }
  }, [code, highlighter, language, variableNames]);

  // Handle initial scroll to specified line
  useEffect(() => {
    if (initialScrollToLine == null || !innerProps.viewportRef?.current) {
      return;
    }

    const scrollToLine = Math.max(0, initialScrollToLine - 1); // Convert to 0-based index

    // Use a small delay to ensure the component is fully rendered
    const timeoutId = setTimeout(() => {
      if (innerProps.viewportRef?.current) {
        // For virtualized components, we can scroll to a specific index
        // For non-virtualized components, we calculate the scroll position
        const scrollOptions: ScrollToOptions = {
          top: scrollToLine * 20, // Approximate line height, will be refined
          behavior: "smooth",
        };

        innerProps.viewportRef.current.scrollTo(scrollOptions);
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [initialScrollToLine, innerProps.viewportRef]);

  const { maxLines } = innerProps;

  const lines = code.split("\n").length;

  const TokenRenderer =
    (maxLines != null && lines <= maxLines + 100) ||
    lines <= 500 ||
    maxLines == null
      ? FernSyntaxHighlighterTokens
      : FernSyntaxHighlighterTokensVirtualized;

  return (
    <TemplateTooltip.Provider value={tooltips ?? EMPTY_OBJECT}>
      <TokenRenderer
        ref={ref}
        tokens={tokens}
        template={template}
        initialScrollToLine={initialScrollToLine}
        {...innerProps}
      />
    </TemplateTooltip.Provider>
  );
});

FernSyntaxHighlighter.displayName = "FernSyntaxHighlighter";
