import Link from "@tiptap/extension-link";

/**
 * Extended Link extension that adds Command+K keyboard shortcut support.
 * This allows users to quickly add or edit links by pressing Cmd+K (Mac) or Ctrl+K (Windows/Linux).
 */
export const LinkExtensionWithShortcut = Link.extend({
    addKeyboardShortcuts() {
        return {
            "Mod-k": () => {
                // Get the current link if one exists
                const { href } = this.editor.getAttributes("link");

                // Dispatch a custom event that the BubbleMenu can listen to
                const event = new CustomEvent("tiptap:openLinkPopover", {
                    detail: { href }
                });
                window.dispatchEvent(event);

                return true;
            }
        };
    }
});
