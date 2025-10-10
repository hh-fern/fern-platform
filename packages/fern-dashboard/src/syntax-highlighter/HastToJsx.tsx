"use client";

import { type FC, memo, useMemo } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";

import type { Root, RootContent } from "hast";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";

interface HastToJSXProps {
    hast: Root | RootContent;
}

/**
 * Converts HAST (HTML Abstract Syntax Tree) to JSX for rendering
 * Used to display Shiki syntax-highlighted code
 */
export const HastToJSX: FC<HastToJSXProps> = memo(({ hast }) => {
    const result = useMemo(
        () =>
            toJsxRuntime(hast, {
                Fragment,
                // @ts-expect-error: the automatic react runtime is untyped.
                jsx,
                // @ts-expect-error: the automatic react runtime is untyped.
                jsxs
            }),
        [hast]
    );

    return result;
});

HastToJSX.displayName = "HastToJSX";
