import React from "react";

import { HydrationBoundary } from "jotai-ssr";

import { Prose } from "@/mdx/components/prose";
import { HideAsides, layoutAtom } from "@/state/layout";

interface PageLayoutProps {
  header?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}

export function PageLayout({ header, children, footer }: PageLayoutProps) {
  return (
    <HydrationBoundary hydrateAtoms={[[layoutAtom, "page"]]}>
      <article className="fern-layout-page">
        <HideAsides force />
        {header}
        <Prose className="prose-h1:mt-[1.5em] first:prose-h1:mt-0 max-w-full">
          {children}
        </Prose>
        {footer}
      </article>
    </HydrationBoundary>
  );
}
