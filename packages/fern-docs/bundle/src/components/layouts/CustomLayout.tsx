import { HydrationBoundary } from "jotai-ssr";

import { HideAsides, layoutAtom } from "@/state/layout";

interface CustomLayoutProps {
  children?: React.ReactNode;
  footer?: React.ReactNode;
}

export function CustomLayout({ children, footer }: CustomLayoutProps) {
  return (
    <HydrationBoundary hydrateAtoms={[[layoutAtom, "custom"]]}>
      <div className="width-before-scroll-bar w-screen">
        <HideAsides force />
        {children}
        {footer}
      </div>
    </HydrationBoundary>
  );
}
