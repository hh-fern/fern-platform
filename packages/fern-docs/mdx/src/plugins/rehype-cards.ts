import { CONTINUE, SKIP, visit } from "unist-util-visit";

import { isMdxJsxElementHast } from "../mdx-utils";
import type { Hast } from "../types";
import type { Unified } from "../unified";

export const rehypeCards: Unified.Plugin<[], Hast.Root> = () => {
    return (ast: Hast.Root) => {
        visit(ast, (node, index, parent) => {
            if (!isMdxJsxElementHast(node)) {
                return CONTINUE;
            }

            if (node.name === "Cards") {
                node.name = "CardGroup";
            }

            if (node.name === "Card" && parent != null && index != null) {
                // ensure the parent component is a CardGroup
                if (isMdxJsxElementHast(parent) && parent.name === "CardGroup") {
                    return CONTINUE;
                }

                parent.children[index] = {
                    type: "mdxJsxFlowElement" as const,
                    name: "CardGroup",
                    children: [node],
                    attributes: []
                };

                // revisit the current node to traverse its children
                return [SKIP, index];
            }

            return CONTINUE;
        });
    };
};
