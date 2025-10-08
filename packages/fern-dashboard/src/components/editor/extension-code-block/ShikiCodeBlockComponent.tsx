import React, { useMemo, useState } from "react";

import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import type { ReactNodeViewProps } from "@tiptap/react";
import { ChevronDown } from "lucide-react";

import { cleanLanguage } from "@fern-api/fdr-sdk/api-definition";
import { FernSyntaxHighlighter } from "@fern-docs/components/syntax-highlighter";

import { SearchableDropdown } from "@/components/ui/SearchableDropdown";

import { allLanguages } from "./lowlight-languages";

export function ShikiCodeBlockComponent(props: ReactNodeViewProps) {
    const defaultLanguage = props.node.attrs.language;
    const [searchTerm, setSearchTerm] = useState("");

    const code = props.node.textContent;
    const language = cleanLanguage(defaultLanguage || "plaintext");

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
        <NodeViewWrapper className="group relative">
            <div className="shiki-code-block-rendered rounded-lg border border-gray-200 bg-white shadow-sm overflow-x-auto">
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
                    <button className="absolute right-2 top-2 z-20 flex cursor-pointer items-center gap-1.5 rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 opacity-0 shadow-sm backdrop-blur transition hover:bg-gray-50 group-hover:opacity-100">
                        <span className="truncate max-w-[100px]">{currentLanguage?.label || "auto"}</span>
                        <ChevronDown className="size-3.5 flex-shrink-0" />
                    </button>
                </SearchableDropdown>

                <FernSyntaxHighlighter language={language} code={code} highlightLines={[]} highlightStyle="highlight" />
            </div>
        </NodeViewWrapper>
    );
}
