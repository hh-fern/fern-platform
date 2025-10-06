import { removeLeadingSlash } from "@fern-api/docs-utils";
import { hasMetadata, type NavigationNodeWithMetadata, type RootNode, traverseBF } from "@fern-api/fdr-sdk/navigation";
import { CONTINUE, STOP } from "@fern-api/fdr-sdk/traversers";

export function getSectionRoot(root: RootNode | undefined, path: string): NavigationNodeWithMetadata | undefined {
    if (root == null) {
        return undefined;
    }

    if (path === "/" || root.slug === removeLeadingSlash(path)) {
        return root;
    }

    let foundNode: NavigationNodeWithMetadata | undefined;

    // traverse the tree in a breadth-first manner because the node we're looking for is likely to be near the root
    traverseBF(root, (node) => {
        if (hasMetadata(node)) {
            if (node.slug === removeLeadingSlash(path)) {
                foundNode = node;
                return STOP;
            }
        }
        return CONTINUE;
    });

    return foundNode;
}
