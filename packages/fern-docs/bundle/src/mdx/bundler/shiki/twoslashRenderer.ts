// inpsire by the vocs twoslash integration
import type { TwoslashRenderer } from "@shikijs/twoslash";
import type { Element, ElementContent } from "hast";
// import { defaultHandlers, toHast } from "mdast-util-to-hast";
import type { ShikiTransformerContextCommon } from "shiki";
// import { mdastFromMarkdown } from "@fern-docs/mdx";
import { NodeHover } from "twoslash";
import { NodeQuery } from "twoslash";

// import { transformerShrinkIndent } from './transformerShrinkIndent.ts'

export function twoslashRenderer(): TwoslashRenderer {
  // function hightlightPopupContent(
  //   codeToHast: ShikiTransformerContextCommon["codeToHast"],
  //   shikiOptions: ShikiTransformerContextCommon["options"],
  //   info: { text?: string; docs?: string }
  // ) {
  //   if (!info.text) return [];

  //   const text = processHoverInfo(info.text) ?? info.text;
  //   if (!text.trim()) return [];

  //   const themedContent = (
  //     (
  //       codeToHast(text, {
  //         ...shikiOptions,
  //       }).children[0] as Element
  //     ).children[0] as Element
  //   ).children;

  //   if (info.docs) {
  //     const santized = info.docs
  //       .replace(/\n?{(@.*)?\s*\n?/g, "")
  //       .replace(/\s*}\n?/g, "")
  //       .replace(/(.)\n(.)/g, "$1 $2")
  //       .replace(/\n?-\s/g, "\n");
  //     const mdast = mdastFromMarkdown(santized, "mdx");
  //     const hast = toHast(mdast, {
  //       handlers: {
  //         code: (
  //           state: any,
  //           node: { type: "code"; lang?: string; value: string }
  //         ) => {
  //           const lang = node.lang || "";
  //           if (lang) {
  //             return codeToHast(node.value, {
  //               ...shikiOptions,
  //               transformers: [],
  //               lang,
  //             }).children[0] as Element;
  //           }
  //           return defaultHandlers.code(state, node) as any;
  //         },
  //       },
  //     }) as Element;
  //     if (info.docs) {
  //       themedContent.push({
  //         type: "element",
  //         tagName: "div",
  //         properties: { class: "twoslash-popup-jsdoc" },
  //         children: hast.children,
  //       });
  //     }
  //   }

  //   return themedContent;
  // }

  return {
    nodeStaticInfo(info, node) {
      try {
        // const themedContent = hightlightPopupContent(
        //   this.codeToHast,
        //   this.options,
        //   info
        // );

        const themedContent = renderRichHighlightPopupContentfunction.call(
          this,
          info
        );

        if (!themedContent.length) return node;

        return {
          type: "element",
          tagName: "span",
          properties: {
            class: "twoslash-hover",
          },
          children: [
            {
              type: "element",
              tagName: "div",
              properties: {
                class: "twoslash-popup-info-hover",
              },
              children: themedContent,
            },
            {
              type: "element",
              tagName: "span",
              properties: {
                class: "twoslash-target",
              },
              children: [node],
            },
          ],
        };
      } catch {
        return node;
      }
    },

    // nodeQuery(info, node) {
    //   try {
    //     if (!info.text) return {};

    //     const themedContent = hightlightPopupContent(
    //       this.codeToHast,
    //       this.options,
    //       info
    //     );

    //     return {
    //       type: "element",
    //       tagName: "span",
    //       properties: {
    //         class: "twoslash-query-persisted",
    //       },
    //       children: [
    //         {
    //           type: "element",
    //           tagName: "span",
    //           properties: {
    //             class: "twoslash-popup-info",
    //           },
    //           children: [
    //             {
    //               type: "element",
    //               tagName: "div",
    //               properties: { class: "twoslash-popup-arrow" },
    //               children: [],
    //             },
    //             {
    //               type: "element",
    //               tagName: "div",
    //               properties: { class: "twoslash-popup-scroll-container" },
    //               children: themedContent,
    //             },
    //           ],
    //         },
    //         node,
    //       ],
    //     };
    //   } catch {
    //     return node;
    //   }
    // },

    // nodeCompletion(query, node) {
    //   try {
    //     if (node.type !== "text")
    //       throw new Error(
    //         `[shiki-twoslash] nodeCompletion only works on text nodes, got ${node.type}`
    //       );

    //     const leftPart = query.completionsPrefix || "";
    //     const rightPart = node.value.slice(leftPart.length || 0);

    //     return {
    //       type: "element",
    //       tagName: "span",
    //       properties: {},
    //       children: [
    //         {
    //           type: "text",
    //           value: leftPart,
    //         },
    //         {
    //           type: "element",
    //           tagName: "span",
    //           properties: {
    //             class: "twoslash-completion-cursor",
    //           },
    //           children: [
    //             {
    //               type: "element",
    //               tagName: "div",
    //               properties: {
    //                 class: "twoslash-completion-list",
    //               },
    //               children: query.completions.map((i) => ({
    //                 type: "element",
    //                 tagName: "div",
    //                 properties: {
    //                   class: "twoslash-completion-list-item",
    //                 },
    //                 children: [
    //                   {
    //                     type: "element",
    //                     tagName: "span",
    //                     properties: {
    //                       class:
    //                         "kindModifiers" in i &&
    //                         typeof i.kindModifiers === "string" &&
    //                         i.kindModifiers?.split(",").includes("deprecated")
    //                           ? "deprecated"
    //                           : undefined,
    //                     },
    //                     children: [
    //                       {
    //                         type: "element",
    //                         tagName: "span",
    //                         properties: {
    //                           class: "twoslash-completions-matched",
    //                         },
    //                         children: [
    //                           {
    //                             type: "text",
    //                             value: i.name.startsWith(
    //                               query.completionsPrefix
    //                             )
    //                               ? query.completionsPrefix
    //                               : "",
    //                           },
    //                         ],
    //                       },
    //                       {
    //                         type: "element",
    //                         tagName: "span",
    //                         properties: {
    //                           class: "twoslash-completions-unmatched",
    //                         },
    //                         children: [
    //                           {
    //                             type: "text",
    //                             value: i.name.startsWith(
    //                               query.completionsPrefix
    //                             )
    //                               ? i.name.slice(
    //                                   query.completionsPrefix.length || 0
    //                                 )
    //                               : i.name,
    //                           },
    //                         ],
    //                       },
    //                     ],
    //                   },
    //                 ],
    //               })),
    //             },
    //           ],
    //         },
    //         {
    //           type: "text",
    //           value: rightPart,
    //         },
    //       ],
    //     };
    //   } catch {
    //     return node;
    //   }
    // },

    // nodeError(_, node) {
    //   try {
    //     return {
    //       type: "element",
    //       tagName: "span",
    //       properties: {
    //         class: "twoslash-error",
    //       },
    //       children: [node],
    //     };
    //   } catch {
    //     return node;
    //   }
    // },

    // lineError(error) {
    //   return [
    //     {
    //       type: "element",
    //       tagName: "div",
    //       properties: {
    //         class: "twoslash-meta-line twoslash-error-line",
    //       },
    //       children: [
    //         {
    //           type: "text",
    //           value: error.text,
    //         },
    //       ],
    //     },
    //   ];
    // },

    // lineCustomTag(tag) {
    //   return [
    //     {
    //       type: "element",
    //       tagName: "div",
    //       properties: {
    //         class: `twoslash-tag-line twoslash-tag-${tag.name}-line`,
    //       },
    //       children: [
    //         {
    //           type: "text",
    //           value: tag.text || "",
    //         },
    //       ],
    //     },
    //   ];
    // },

    // nodesHighlight(_, nodes) {
    //   return [
    //     {
    //       type: "element",
    //       tagName: "span",
    //       properties: {
    //         class: "twoslash-highlighted",
    //       },
    //       children: nodes,
    //     },
    //   ];
    // },
  };
}

const regexType = /^[A-Z]\w*(<[^>]*>)?:/;
const regexFunction = /^\w*\(/;

/**
 * The default hover info processor, which will do some basic cleanup
 */
export function processHoverInfo(type: string): string {
  let content = type
    // remove leading `(property)` or `(method)` on each line
    .replace(/^\(([\w-]+)\)\s+/gm, "")
    // remove import statement
    .replace(/\nimport .*$/, "")
    // remove interface or namespace lines with only the name
    .replace(/^(interface|namespace) \w+$/gm, "")
    .trim();

  // Add `type` or `function` keyword if needed
  if (content.match(regexType)) content = `type ${content}`;
  else if (content.match(regexFunction)) content = `function ${content}`;

  return content;
}

function renderMarkdownPassThrough(markdown: string): ElementContent[] {
  return [
    {
      type: "text",
      value: markdown,
    },
  ];
}

function renderRichHighlightPopupContentfunction(
  this: ShikiTransformerContextCommon,
  info: NodeHover | NodeQuery
): ElementContent[] {
  if (!info.text) return [];
  const content = processHoverInfo(info.text);
  if (!content || content === "any") return [];

  const popupContents: ElementContent[] = [];

  const typeCode: Element = {
    type: "element",
    tagName: "code",
    properties: {},
    children: this.codeToHast(content, {
      ...this.options,
      meta: {},
      transformers: [],
      lang:
        this.options.lang === "tsx" || this.options.lang === "jsx"
          ? "tsx"
          : "ts",
      structure: content.trim().includes("\n") ? "classic" : "inline",
    }).children as ElementContent[],
  };
  typeCode.properties.class = "twoslash-popup-code";

  popupContents.push(typeCode);

  if (info.docs) {
    // const docs = processHoverDocs(info.docs) ?? info.docs;
    const docs = processHoverInfo(info.docs) ?? info.docs;
    if (docs) {
      const children = renderMarkdownPassThrough.call(this, docs);
      popupContents.push({
        type: "element",
        tagName: "div",
        properties: { class: "twoslash-popup-docs" },
        children,
      });
    }
  }

  if (info.tags?.length) {
    popupContents.push({
      type: "element",
      tagName: "div",
      properties: {
        class: "twoslash-popup-docs twoslash-popup-docs-tags",
      },
      children: info.tags.map(
        (tag) =>
          ({
            type: "element",
            tagName: "span",
            properties: {
              class: `twoslash-popup-docs-tag`,
            },
            children: [
              {
                type: "element",
                tagName: "span",
                properties: {
                  class: "twoslash-popup-docs-tag-name",
                },
                children: [
                  {
                    type: "text",
                    value: `@${tag[0]}`,
                  },
                ],
              },
              ...(tag[1]
                ? [
                    {
                      type: "element",
                      tagName: "span",
                      properties: {
                        class: "twoslash-popup-docs-tag-value",
                      },
                      children: renderMarkdownPassThrough.call(this, tag[1]),
                    } as Element,
                  ]
                : []),
            ],
          }) as Element
      ),
    });
  }

  return popupContents;
}
