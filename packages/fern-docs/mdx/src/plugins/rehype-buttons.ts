import { CONTINUE, visit } from "unist-util-visit";

import { isMdxJsxElementHast } from "../mdx-utils";
import type { Hast } from "../types";
import type { Unified } from "../unified";

export const rehypeButtons: Unified.Plugin<[], Hast.Root> = () => {
    return (ast: Hast.Root) => {
        visit(ast, (node) => {
            if (!isMdxJsxElementHast(node)) {
                return CONTINUE;
            }

            if (node.name === "Buttons") {
                node.name = "ButtonGroup";
            }

            return CONTINUE;
        });
    };
};
