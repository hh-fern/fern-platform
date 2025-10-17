"use client";

import { useCurrentPathname } from "@fern-docs/components/hooks/use-current-pathname";
import React, { type ReactNode } from "react";

import { FernAnchor } from "@/components/FernAnchor";

interface LinkProps {
    /**
     * The anchor ID to append to the current page URL (e.g., "data" creates "#data")
     */
    href: string;
    children: ReactNode;
}

/**
 * Link component that wraps content and generates a stable anchor link
 * 
 * Example:
 * ```jsx
 * <Link href="data">
 *   and the data would be
 * </Link>
 * ```
 * This will render the text with a linkable anchor at `{current-page-url}#data`
 */
export function Link({ href, children }: LinkProps) {
    const pathname = useCurrentPathname();
    
    const anchorId = href.startsWith("#") ? href.slice(1) : href;
    const fullHref = `${pathname}#${anchorId}`;

    return (
        <FernAnchor href={fullHref} asChild>
            <span id={anchorId}>{children}</span>
        </FernAnchor>
    );
}
