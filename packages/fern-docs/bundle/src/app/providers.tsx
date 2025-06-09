"use client";

import { ProgressProvider } from "@bprogress/next/app";
import { TooltipProvider } from "@radix-ui/react-tooltip";

import { JotaiProvider } from "@fern-docs/components/contexts/jotai-provider";
import { Toaster } from "@fern-docs/components/toaster";

import StyledJsxRegistry from "./registry";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StyledJsxRegistry>
      <JotaiProvider>
        <TooltipProvider>
          <Toaster />
          <ProgressProvider
            height="3px"
            color="var(--accent)"
            options={{ showSpinner: false }}
            disableSameURL
            delay={300}
            memo
            shouldCompareComplexProps
          >
            {children}
          </ProgressProvider>
        </TooltipProvider>
      </JotaiProvider>
    </StyledJsxRegistry>
  );
}
