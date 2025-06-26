"use client";

import { ProgressBar, ProgressBarProvider } from "react-transition-progress";

import { TooltipProvider } from "@radix-ui/react-tooltip";

import { Toaster } from "../FernToast";
import { JotaiProvider } from "../state/jotai-provider";
import StyledJsxRegistry from "./registry";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StyledJsxRegistry>
      <JotaiProvider>
        <TooltipProvider>
          <Toaster />
          <ProgressBarProvider>
            <ProgressBar className="bg-accent shadow-accent absolute top-0 z-50 h-1 w-screen shadow-lg" />
            {children}
          </ProgressBarProvider>
        </TooltipProvider>
      </JotaiProvider>
    </StyledJsxRegistry>
  );
}
