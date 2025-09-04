import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";

import { CustomElementNodeView } from "./CustomElementNodeView";

/**
 * The tag name for the custom element node. Also used as the node name and the plugin key.
 */
const TAG = "custom-element-v2";

export interface CustomElementOptions {
  /**
   * The HTML attributes for a custom element node.
   * @default {}
   * @example { class: 'foo' }
   */
  HTMLAttributes: Record<string, any>;
}

/**
 * This extension allows you to create custom elements.
 */
export const CustomElement = Node.create<CustomElementOptions>({
  name: TAG,

  group: "block",

  content: "text*",

  atom: true,

  draggable: true,

  selectable: true,

  code: true,

  /**
   * The data attributes are used to store the original content of the custom element.
   * @example <custom-element data-hash="..." data-type="..." data-name="..." />
   */
  addAttributes() {
    return {
      "fve-data-hash": {
        default: null,
      },
      "fve-data-type": {
        default: null,
      },
      "fve-data-name": {
        default: null,
      },
      "fve-mdx-content": {
        default: null,
      },
      "fve-unsupported": {
        default: null,
      },
      /**
       * Set contenteditable to false to prevent the custom element from being edited.
       */
      contenteditable: {
        default: false,
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(CustomElementNodeView, {
      as: "custom-element-v2",
      attrs: ({ node }) => ({
        ...node.attrs,
      }),
    });
  },

  parseHTML() {
    return [{ tag: TAG }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      TAG,
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ];
  },
});
