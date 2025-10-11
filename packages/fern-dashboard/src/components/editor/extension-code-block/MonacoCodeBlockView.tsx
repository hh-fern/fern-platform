import type { Node } from "@tiptap/pm/model";
import type { EditorView, NodeView } from "@tiptap/pm/view";

/**
 * TipTap NodeView that renders Monaco editor in an iframe for code blocks.
 * This replaces the default <pre><code> rendering with an interactive Monaco editor.
 */
export class MonacoCodeBlockView implements NodeView {
    node: Node;
    view: EditorView;
    getPos: () => number | undefined;
    dom: HTMLElement;
    iframe: HTMLIFrameElement;
    isDark: boolean;
    messageHandler: ((event: MessageEvent) => void) | null = null;

    constructor(node: Node, view: EditorView, getPos: () => number | undefined) {
        // Validate inputs
        if (!node) {
            console.error("[MonacoCodeBlockView] No node provided!");
            throw new Error("MonacoCodeBlockView requires a node");
        }
        if (!node.type) {
            console.error("[MonacoCodeBlockView] Node has no type!", node);
            throw new Error("MonacoCodeBlockView node must have a type");
        }

        this.node = node;
        this.view = view;
        this.getPos = getPos;

        // Debug: log node structure
        console.log("[MonacoCodeBlockView] Creating view for node:", {
            type: node.type.name,
            attrs: node.attrs,
            textContent: node.textContent.substring(0, 50)
        });

        // Detect dark mode from the document
        this.isDark = document.documentElement.classList.contains("dark");

        // Create container div for Monaco editor
        // TipTap's renderHTML override will handle proper HTML serialization
        this.dom = document.createElement("div");
        this.dom.className = "monaco-code-block-container relative";

        // Create iframe for Monaco editor
        this.iframe = document.createElement("iframe");
        this.iframe.className = "w-full rounded border-0";

        // Generate unique ID for this code block instance
        const iframeId = `monaco-${Math.random().toString(36).substring(2, 15)}`;
        this.iframe.id = iframeId;

        // Delay iframe src to allow browser to cache Monaco modules from earlier iframes
        // This reduces duplicate network requests to esm.sh
        setTimeout(() => {
            this.updateIframeSrc();
        }, Math.random() * 100); // Random 0-100ms delay to stagger loads

        // Set initial height based on content
        this.updateHeight();

        // Listen for messages from Monaco iframe
        this.messageHandler = (event: MessageEvent) => {
            if (event.data?.type === "monaco-value-change" && event.data.iframeId === iframeId) {
                this.handleMonacoChange(event.data.value);
            }
        };
        window.addEventListener("message", this.messageHandler);

        this.dom.appendChild(this.iframe);
    }

    /**
     * Update the iframe src based on current node content and attributes
     */
    updateIframeSrc() {
        const code = this.node.textContent ?? "";
        // TipTap's CodeBlock extension uses 'language' attribute, fallback to plaintext if not set
        const language = this.node.attrs?.language ?? "plaintext";
        const theme = this.isDark ? "material-theme-darker" : "min-light";

        // Calculate height based on line count
        const lineCount = (code || "").split("\n").length;
        const maxLines = 20;
        const displayLines = Math.min(lineCount, maxLines);
        const height = Math.max(displayLines * 22 + 40, 100);

        this.iframe.src = `/api/monaco-editor?code=${encodeURIComponent(code)}&language=${language}&theme=${theme}&readOnly=false&iframeId=${this.iframe.id}`;
        this.iframe.style.height = `${height}px`;
    }

    /**
     * Update iframe height based on content
     */
    updateHeight() {
        const code = this.node.textContent ?? "";
        const lineCount = (code || "").split("\n").length;
        const maxLines = 20;
        const displayLines = Math.min(lineCount, maxLines);
        const height = Math.max(displayLines * 22 + 40, 100);
        this.iframe.style.height = `${height}px`;
    }

    /**
     * Handle code changes from Monaco editor
     */
    handleMonacoChange(newCode: string) {
        const pos = this.getPos();
        if (pos === undefined) return;

        const { state, dispatch } = this.view;
        const { tr } = state;

        // Get the current node
        const nodeStart = pos;
        const nodeEnd = pos + this.node.nodeSize;

        // Replace the code block's text content while preserving attributes
        const textNode = state.schema.text(newCode);

        // Delete old content and insert new
        tr.delete(nodeStart + 1, nodeEnd - 1);
        if (newCode) {
            tr.insert(nodeStart + 1, textNode);
        }

        dispatch(tr);
    }

    /**
     * Update the view when the node changes (e.g., language attribute changed)
     */
    update(node: Node) {
        // Only accept updates for the same node type
        if (node.type !== this.node.type) {
            return false;
        }

        // Check if we need to update the iframe
        const oldCode = this.node.textContent ?? "";
        const newCode = node.textContent ?? "";
        const oldLanguage = this.node.attrs?.language;
        const newLanguage = node.attrs?.language;

        this.node = node;

        // If language changed or code changed (from external source), update iframe
        if (oldLanguage !== newLanguage || oldCode !== newCode) {
            this.updateIframeSrc();
        }

        this.updateHeight();

        return true;
    }

    /**
     * Cleanup when the node is destroyed
     */
    destroy() {
        if (this.messageHandler) {
            window.removeEventListener("message", this.messageHandler);
        }
    }

    /**
     * Prevent TipTap from managing content (we handle it via iframe)
     */
    ignoreMutation() {
        return true;
    }
}
