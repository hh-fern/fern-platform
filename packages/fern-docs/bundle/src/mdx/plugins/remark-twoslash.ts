import { Mdast, visit } from "@fern-docs/mdx";

export function remarkTwoslash() {
  return (tree: Mdast.Root) => {
    visit(tree, (node) => {
      if (node.type === "code" && node.value.includes("// @")) {
        node.value = node.value
          .replace(/(\/\/\s@.*:\s.*)\n(\/\/)/g, "$1\n\n$2")
          .replace(/(\/\/\s@.*:\s.*)\n(\/\/)/g, "$1\n\n$2");
      }
    });
  };
}
