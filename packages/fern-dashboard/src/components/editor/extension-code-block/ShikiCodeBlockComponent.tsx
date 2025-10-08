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
                <button className="border-border-default absolute right-2 top-2 z-10 flex cursor-pointer justify-between gap-3 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 shadow-sm hover:bg-gray-50">
                    <span className="truncate">{currentLanguage?.label || "auto"}</span>
                    <ChevronDown className="size-4" />
                </button>
            </SearchableDropdown>

            <div className="shiki-code-block-rendered rounded-lg border border-gray-200 bg-white shadow-sm overflow-x-auto">
                <FernSyntaxHighlighter language={language} code={code} highlightLines={[]} highlightStyle="highlight" />
            </div>
        </NodeViewWrapper>
    );
}
