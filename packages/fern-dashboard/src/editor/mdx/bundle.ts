import { bundleMDX as internalBundleMDX } from "mdx-bundler";
import rehypeKatex from "rehype-katex";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";

import type { DocsLoader } from "@fern-api/docs-server/docs-loader";
import {
    rehypeAccordions,
    rehypeButtons,
    rehypeCards,
    rehypeCodeBlock,
    rehypeMdxClassStyle,
    rehypeParamField,
    rehypeSteps,
    rehypeTable,
    rehypeTabs
} from "@fern-docs/mdx/plugins";

import { rehypeEditorComponents } from "./plugins/rehype-editor-components";
import { rehypeEndpointExampleSnippets } from "./plugins/rehype-endpoint-example-snippets";
import { rehypeEndpointSchemaSnippets } from "./plugins/rehype-endpoint-schema-snippets";

export async function bundleMDX(
    source: string,
    options?: {
        loader?: DocsLoader;
    }
) {
    const { loader } = options ?? {};

    const { code } = await internalBundleMDX({
        source,
        mdxOptions: (options) => {
            // Add remark plugins (markdown processing)
            const remarkPlugins = [
                ...(options.remarkPlugins ?? []),
                remarkFrontmatter,
                [remarkMdxFrontmatter, { name: "metadata" }],
                remarkGfm,
                remarkMath
            ];

            // Add rehype plugins (HTML/HAST processing)
            // Match the order from fern-docs/bundle for consistency
            const rehypePlugins = [
                ...(options.rehypePlugins ?? []),
                rehypeKatex,
                rehypeMdxClassStyle,
                rehypeCodeBlock,
                rehypeSteps,
                rehypeAccordions,
                rehypeTable,
                rehypeTabs,
                rehypeCards,
                rehypeParamField,
                rehypeButtons,
                // Add loader-dependent plugins if loader is available
                ...(loader
                    ? [
                          [rehypeEndpointSchemaSnippets, { loader }],
                          [rehypeEndpointExampleSnippets, { loader }]
                      ]
                    : []),
                // Always add editor components plugin last to ensure proper component name conversion
                rehypeEditorComponents
            ];

            options.remarkPlugins = remarkPlugins;
            options.rehypePlugins = rehypePlugins;
            return options;
        }
    });

    return { code };
}
