"use client";

import type { TableOfContentsItem } from "@fern-docs/mdx";
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

interface TableOfContentsContextValue {
    tableOfContents: TableOfContentsItem[];
    setTableOfContents: (toc: TableOfContentsItem[]) => void;
    mergeToc: (newToc: TableOfContentsItem[]) => void;
}

const TableOfContentsContext = createContext<TableOfContentsContextValue | undefined>(undefined);

export function TableOfContentsProvider({ children }: { children: React.ReactNode }) {
    const [tableOfContents, setTableOfContents] = useState<TableOfContentsItem[]>([]);

    // Merge multiple TOC arrays (for pages with multiple MDX blocks)
    const mergeToc = useCallback((newToc: TableOfContentsItem[]) => {
        setTableOfContents((prev) => {
            // Simple merge - just concatenate and dedupe by anchorString
            const merged = [...prev, ...newToc];
            const seen = new Set<string>();
            return merged.filter((item) => {
                if (seen.has(item.anchorString)) {
                    return false;
                }
                seen.add(item.anchorString);
                return true;
            });
        });
    }, []);

    const value = useMemo(
        () => ({
            tableOfContents,
            setTableOfContents,
            mergeToc
        }),
        [tableOfContents, mergeToc]
    );

    return <TableOfContentsContext.Provider value={value}>{children}</TableOfContentsContext.Provider>;
}

export function useTableOfContents() {
    const context = useContext(TableOfContentsContext);
    if (!context) {
        throw new Error("useTableOfContents must be used within a TableOfContentsProvider");
    }
    return context;
}
