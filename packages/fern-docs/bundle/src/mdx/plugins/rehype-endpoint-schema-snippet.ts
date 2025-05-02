import {
  CONTINUE,
  Hast,
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
 * This plugin is used to fill in the `endpointDefinition`, `slugs`, and
 * `types` props for an `EndpointSchemaSnippet` node. This is necessary to fill
 * in the `EndpointSchemaSnippet` node with the correct prop values to render.
 */
export const rehypeEndpointSchemaSnippets: Unified.Plugin<
  [{ loader: DocsLoader }?],
  Hast.Root
> = (opts) => {
  if (!opts) {
    return;
  }
  const loader = opts.loader;

  return async (ast: Hast.Root) => {
    const promises: Promise<void>[] = [];

    visit(ast, (node, index, parent) => {
      // console.log("SCHEMA SNIPPET node0", node);
      if (!isMdxJsxElementHast(node) || index == null || parent == null) {
        // console.log("SCHEMA SNIPPET exit @ isMdxJsxElementHast", node);
        return CONTINUE;
      }

      console.log("SCHEMA SNIPPET node1", node);

      console.log("SCHEMA SNIPPET node.name is:", node.name);

      // check that the current node is an endpoint snippet
      if (node.name != null && node.name === "EndpointSchemaSnippet") {
        console.log("SCHEMA SNIPPET in @ node.name if");
        const { props } = hastMdxJsxElementHastToProps(node);

        // cannot parse non-string endpoint prop
        if (typeof props.endpoint !== "string") {
          console.log("SCHEMA SNIPPET exit @ props.endpoint");
          return CONTINUE;
        }

        const extracted = extractMethodAndPath(props.endpoint);

        // cannot parse endpoint prop
        if (extracted == null) {
          console.log("SCHEMA SNIPPET exit @ extracted");
          return CONTINUE;
        }

        const { method, path } = extracted;
        console.log("SCHEMA SNIPPET extracted", extracted);

        promises.push(
          (async () => {
            try {
              const { endpoint, slugs, apiDefinitionId } =
                await loader.getEndpointByLocator(
                  method,
                  path,
                  typeof props.example === "string" ? props.example : undefined
                );
              const { types, endpoint: endpointDefinition } =
                await loader.getEndpointById(apiDefinitionId, endpoint.id);
              console.log(
                node.name,
                "SCHEMA SNIPPET endpoint",
                endpoint,
                "SCHEMA SNIPPET slugs",
                slugs,
                "SCHEMA SNIPPET apiDefinitionId",
                apiDefinitionId,
                "SCHEMA SNIPPET types",
                types
              );

              node.attributes.push(
                unknownToMdxJsxAttribute(
                  "endpointDefinition",
                  endpointDefinition
                ),
                unknownToMdxJsxAttribute("slug", slugs[0]),
                unknownToMdxJsxAttribute("types", types)
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
