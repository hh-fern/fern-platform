import React, { useEffect, useMemo, useState } from "react";

import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import type { ReactNodeViewProps } from "@tiptap/react";
import { ChevronDown } from "lucide-react";
import { bundledLanguages, createHighlighter, type BundledLanguage, type Highlighter } from "shiki";

import { SearchableDropdown } from "@/components/ui/SearchableDropdown";

import { allLanguages } from "./lowlight-languages";

let highlighterInstance: Highlighter | null = null;

async function getHighlighter(): Promise<Highlighter> {
    if (!highlighterInstance) {
        highlighterInstance = await createHighlighter({
            themes: ["min-light", "material-theme-darker"],
            langs: Object.keys(bundledLanguages) as BundledLanguage[]
        });
    }
    return highlighterInstance;
}

export function ShikiCodeBlockComponent(props: ReactNodeViewProps) {
    const defaultLanguage = props.node.attrs.language;
    const [searchTerm, setSearchTerm] = useState("");
    const [highlightedHtml, setHighlightedHtml] = useState<string>("");

    const code = props.node.textContent;
    const language = (defaultLanguage || "plaintext") as BundledLanguage;

    useEffect(() => {
        let cancelled = false;

        void (async () => {
            const highlighter = await getHighlighter();
            if (!cancelled) {
                try {
                    const html = highlighter.codeToHtml(code, {
                        lang: language,
                        themes: {
                            light: "min-light",
                            dark: "material-theme-darker"
                        }
                    });
                    setHighlightedHtml(html);
                } catch (error) {
                    console.warn(`Failed to highlight code with language "${language}":`, error);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [code, language]);

    const languages = useMemo(() => {
        const filteredLanguages = searchTerm
            ? allLanguages.filter((lang: string) => lang.toLowerCase().includes(searchTerm.toLowerCase()))
            : allLanguages;

        return [
            { value: "null", label: "auto" },
            { value: "disabled", label: "—", disabled: true },
            ...filteredLanguages.map((lang: string) => ({
                value: lang,
                label: lang
            }))
        ];
    }, [searchTerm]);

    const currentLanguage = languages.find((lang) => lang.value === defaultLanguage);

    return (
        <NodeViewWrapper className="relative">
            <SearchableDropdown
                items={languages}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onSelect={(language) => {
                    if (!language.disabled) {
                        props.updateAttributes({ language: language.value });
                    }
                }}
                searchPlaceholder="Search languages..."
                emptyMessage="No languages found"
                getItemKey={(language) => language.value}
                renderItem={(language, onSelect) => (
                    <div
                        className={`flex w-full cursor-pointer rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-gray-200 hover:transition-none focus:bg-gray-200 focus:outline-none ${
                            language.disabled ? "cursor-not-allowed opacity-50" : ""
                        }`}
                        onClick={() => !language.disabled && onSelect()}
                    >
                        {language.label}
                    </div>
                )}
            >
                <button className="border-border-default absolute right-2 top-2 z-10 flex cursor-pointer justify-between gap-3 rounded-md border bg-gray-800/90 px-2 py-1 text-xs text-white hover:bg-gray-700">
                    <span className="truncate">{currentLanguage?.label || "auto"}</span>
                    <ChevronDown className="size-4" />
                </button>
            </SearchableDropdown>

            {highlightedHtml ? (
                <div
                    className="shiki-code-block-rendered [&_pre]:m-0 [&_pre]:rounded-md [&_pre]:p-4"
                    dangerouslySetInnerHTML={{ __html: highlightedHtml }}
                />
            ) : (
                <pre className="m-0 rounded-md bg-gray-900 p-4">
                    <code className="text-gray-300">
                        <NodeViewContent />
                    </code>
                </pre>
            )}
        </NodeViewWrapper>
    );
}
