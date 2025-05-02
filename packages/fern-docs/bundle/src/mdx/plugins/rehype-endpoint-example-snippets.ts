import {
  CONTINUE,
  Hast,
  MdxJsxAttributeValueExpression,
  SKIP,
  Unified,
  hastMdxJsxElementHastToProps,
  isMdxJsxElementHast,
  unknownToMdxJsxAttribute,
  visit,
} from "@fern-docs/mdx";

import { extractMethodAndPath } from "@/components/util/endpoint";
import { DocsLoader } from "@/server/docs-loader";

/**
 * The code below copies the `example` prop of an
 * `EndpointRequestSnippet` to the next `EndpointResponseSnippet` in the
 * tree. For this behavior to take effect, the following conditions
 * must be met:
 *
 * - The `EndpointResponseSnippet` must not have an `example` prop.
 * - The `EndpointResponseSnippet` must have the same `path` and
 * `method` props as the `EndpointRequestSnippet`.
 */
export const rehypeEndpointExampleSnippets: Unified.Plugin<
  [{ loader: DocsLoader }?],
  Hast.Root
> = (opts) => {
  if (!opts) {
    return;
  }
  const loader = opts.loader;

  return async (ast: Hast.Root) => {
    let request:
      | {
          path: string;
          method: string;
          example: string | MdxJsxAttributeValueExpression | undefined;
        }
      | undefined;

    const promises: Promise<void>[] = [];

    visit(ast, (node, index, parent) => {
      console.log("node0", node);
      if (!isMdxJsxElementHast(node) || index == null || parent == null) {
        return CONTINUE;
      }

      const ENDPOINT_SNIPPET_NAMES = new Set([
        "EndpointRequestSnippet",
        "EndpointResponseSnippet",
        // "EndpointSchemaSnippet",
      ]);
      console.log("node1", node);

      // check that the current node is an endpoint snippet
      if (node.name != null && ENDPOINT_SNIPPET_NAMES.has(node.name)) {
        console.log("in @ node.name if");
        const { props } = hastMdxJsxElementHastToProps(node);

        // cannot parse non-string endpoint prop
        if (typeof props.endpoint !== "string") {
          console.log("exit @ props.endpoint");
          return CONTINUE;
        }

        const extracted = extractMethodAndPath(props.endpoint);

        // cannot parse endpoint prop
        if (extracted == null) {
          return CONTINUE;
        }

        const { method, path } = extracted;
        console.log("extracted", extracted);

        switch (node.name) {
          // case "EndpointSchemaSnippet":
          //   request = {
          //     path,
          //     method,
          //     example: undefined,
          //   };
          //   break;
          case "EndpointRequestSnippet":
            if (props.example) {
              request = {
                path,
                method,
                example: props.example,
              };
            } else {
              // reset the request reference
              request = undefined;
            }
            break;
          case "EndpointResponseSnippet":
            if (
              props.example == null &&
              request != null &&
              request.path === path &&
              request.method === method
            ) {
              node.attributes.push({
                type: "mdxJsxAttribute",
                name: "example",
                value: request.example,
              });
            }
            // reset the request reference
            request = undefined;
            break;

          default:
            break;
        }

        promises.push(
          (async () => {
            try {
              const { endpoint, slugs } = await loader.getEndpointByLocator(
                method,
                path,
                typeof props.example === "string" ? props.example : undefined
              );
              console.log("endpoint", endpoint);
              console.log("slugs", slugs);

              node.attributes.push(
                unknownToMdxJsxAttribute("endpointDefinition", endpoint),
                unknownToMdxJsxAttribute("slugs", slugs)
              );
            } catch (e) {
              console.error(
                `Could not find endpoint for ${method} ${path} ${props.example}`,
                e
              );
            }
          })()
        );

        return SKIP;
      }

      return CONTINUE;
    });

    if (promises.length > 0) {
      // wait for all promises to resolve before proceeding
      await Promise.all(promises);
    }
  };
};
