"use client";

import React from "react";

import { HiddenSidebar } from "../state/layout";

// data-aside-state styling is only used in the changelog overview
// this should be deterministic
export const AsideAwareDiv = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div"> & {
    blame?: string;
    isFullPage: boolean;
  }
>(({ children, isFullPage, blame, ...props }, ref) => {
  return (
    <div
      ref={ref}
      {...props}
      data-aside-state={isFullPage ? "hidden" : "visible"}
    >
      {isFullPage && <HiddenSidebar blame={`aside-aware-div:${blame}`} />}
      {children}
    </div>
  );
});

AsideAwareDiv.displayName = "AsideAwareDiv";
