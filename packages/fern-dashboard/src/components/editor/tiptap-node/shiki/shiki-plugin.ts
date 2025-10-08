import { findChildren } from "@tiptap/core";
import type { Node as ProsemirrorNode } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { bundledLanguages, createHighlighter, type BundledLanguage, type Highlighter } from "shiki";

let highlighterInstance: Highlighter | null = null;

async function getHighlighter(): Promise<Highlighter> {
    if (!highlighterInstance) {
        console.log("[ShikiPlugin] Initializing Shiki highlighter...");
        highlighterInstance = await createHighlighter({
            themes: ["min-light", "material-theme-darker"],
            langs: Object.keys(bundledLanguages) as BundledLanguage[]
        });
        console.log("[ShikiPlugin] Shiki highlighter initialized");
    }
    return highlighterInstance;
}

interface ParsedToken {
    text: string;
    color: string;
    fontStyle?: number;
}

function parseShikiTokens(code: string, language: BundledLanguage, highlighter: Highlighter): ParsedToken[] {
    const tokens: ParsedToken[] = [];

    try {
        // Use dark theme for better contrast on dark editor background
        const highlighted = highlighter.codeToTokensBase(code, {
            lang: language,
            theme: "material-theme-darker"
        });

        for (const line of highlighted) {
            for (const token of line) {
                tokens.push({
                    text: token.content,
                    color: token.color || "",
                    fontStyle: token.fontStyle
                });
            }
        }
    } catch (error) {
        console.warn(`[ShikiPlugin] Failed to tokenize with language "${language}":`, error);
    }

    return tokens;
}

function getDecorations({
    doc,
    name,
    highlighter,
    defaultLanguage
}: {
    doc: ProsemirrorNode;
    name: string;
    highlighter: Highlighter;
    defaultLanguage: string | null | undefined;
}): DecorationSet {
    const decorations: Decoration[] = [];

    findChildren(doc, (node) => node.type.name === name).forEach((block) => {
        let from = block.pos + 1;
        const language = (block.node.attrs.language || defaultLanguage || "plaintext") as BundledLanguage;
        const code = block.node.textContent;

        const tokens = parseShikiTokens(code, language, highlighter);

        tokens.forEach((token) => {
            const to = from + token.text.length;

            if (token.color) {
                const style = `color: ${token.color};${token.fontStyle === 1 ? " font-style: italic;" : ""}${token.fontStyle === 2 ? " font-weight: bold;" : ""}`;

                const decoration = Decoration.inline(from, to, {
                    style
                });

                decorations.push(decoration);
            }

            from = to;
        });
    });

    return DecorationSet.create(doc, decorations);
}

export function ShikiPlugin({
    name,
    defaultLanguage
}: {
    name: string;
    defaultLanguage: string | null | undefined;
}) {
    let highlighter: Highlighter | null = null;
    let editorView: any = null;

    // Initialize the highlighter and trigger a re-render when ready
    void getHighlighter().then((h) => {
        highlighter = h;
        console.log("[ShikiPlugin] Highlighter loaded, triggering re-decoration");
        // Force re-decoration after highlighter loads
        if (editorView) {
            editorView.dispatch(editorView.state.tr.setMeta("forceUpdate", true));
        }
    });

    const shikiPlugin = new Plugin({
        key: new PluginKey("shiki"),

        state: {
            init: (_, { doc }) => {
                if (!highlighter) {
                    return DecorationSet.empty;
                }
                return getDecorations({
                    doc,
                    name,
                    highlighter,
                    defaultLanguage
                });
            },
            apply: (transaction, decorationSet, oldState, newState) => {
                if (!highlighter) {
                    return DecorationSet.empty;
                }

                const oldNodeName = oldState.selection.$head.parent.type.name;
                const newNodeName = newState.selection.$head.parent.type.name;
                const oldNodes = findChildren(oldState.doc, (node) => node.type.name === name);
                const newNodes = findChildren(newState.doc, (node) => node.type.name === name);

                if (
                    transaction.docChanged &&
                    ([oldNodeName, newNodeName].includes(name) ||
                        newNodes.length !== oldNodes.length ||
                        transaction.steps.some((step: any) => {
                            return (
                                step.from !== undefined &&
                                step.to !== undefined &&
                                oldNodes.some((node) => {
                                    return node.pos >= step.from && node.pos + node.node.nodeSize <= step.to;
                                })
                            );
                        }))
                ) {
                    return getDecorations({
                        doc: transaction.doc,
                        name,
                        highlighter,
                        defaultLanguage
                    });
                }

                return decorationSet.map(transaction.mapping, transaction.doc);
            }
        },

        props: {
            decorations(state) {
                return shikiPlugin.getState(state);
            }
        },

        view(view) {
            editorView = view;
            return {};
        }
    });

    return shikiPlugin;
}
