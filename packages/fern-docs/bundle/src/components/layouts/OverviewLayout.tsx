import React from "react";

import { HydrationBoundary } from "jotai-ssr";

import { Prose } from "@/mdx/components/prose";
import { layoutAtom } from "@/state/layout";

import { AsideAwareDiv } from "./AsideAwareDiv";

interface OverviewLayoutProps {
  header?: React.ReactNode;
  toc?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}

export function OverviewLayout({
  header,
  toc,
  children,
  footer,
}: OverviewLayoutProps) {
  return (
    <HydrationBoundary hydrateAtoms={[[layoutAtom, "overview"]]}>
      {toc}
      <AsideAwareDiv className="fern-layout-overview">
        <article className="w-content-wide-width max-w-full">
          {header}
          <Prose className="prose-h1:mt-[1.5em] first:prose-h1:mt-0 max-w-full">
            {children}
          </Prose>
          {footer}
        </article>
      </AsideAwareDiv>
    </HydrationBoundary>
  );
}
