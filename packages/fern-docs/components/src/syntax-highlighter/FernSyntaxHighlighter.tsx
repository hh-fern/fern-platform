"use client";

import { forwardRef, useEffect, useMemo, useState } from "react";

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

export interface Measurements {
  lineHeight: number;
  scrollAreaRef: React.RefObject<HTMLElement | null>;
  contentTopOffset: number; // Offset from top of scroll area to first line
}

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
  firstLineOnLoad?: number;
}

export const FernSyntaxHighlighter = forwardRef<
  HTMLPreElement,
  FernSyntaxHighlighterProps
>((props, ref) => {
  const { code, language, tooltips, template, firstLineOnLoad, ...innerProps } =
    props;
  const highlighter = useHighlighter(language);
  const [measurements, setMeasurements] = useState<Measurements | null>(null);

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

  // Calculate and perform initial scroll
  useEffect(() => {
    if (firstLineOnLoad == null || !measurements?.scrollAreaRef.current) {
      return;
    }

    const scrollToLine = Math.max(0, firstLineOnLoad - 1);
    const scrollTop =
      scrollToLine * measurements.lineHeight + measurements.contentTopOffset;

    console.log("FernSyntaxHighlighter: Scrolling to line", {
      firstLineOnLoad,
      scrollToLine,
      lineHeight: measurements.lineHeight,
      contentTopOffset: measurements.contentTopOffset,
      scrollTop,
    });

    const timeoutId = setTimeout(() => {
      if (measurements.scrollAreaRef.current) {
        measurements.scrollAreaRef.current.scrollTo({
          top: scrollTop,
          behavior: "smooth",
        });
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [firstLineOnLoad, measurements]);

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
        onMeasurementsReady={setMeasurements}
        {...innerProps}
      />
    </TemplateTooltip.Provider>
  );
});

FernSyntaxHighlighter.displayName = "FernSyntaxHighlighter";
