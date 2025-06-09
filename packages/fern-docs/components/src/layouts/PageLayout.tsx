import React from "react";

import { HideAsides, SetLayout } from "../../../../commons/state/src/layout";
import { Prose } from "../mdx/components/prose";

interface PageLayoutProps {
  header?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}

export function PageLayout({ header, children, footer }: PageLayoutProps) {
  return (
    <article className="fern-layout-page">
      <SetLayout value="page" />
      <HideAsides force />
      {header}
      <Prose className="prose-h1:mt-[1.5em] first:prose-h1:mt-0 max-w-full">
        {children}
      </Prose>
      {footer}
    </article>
  );
}
