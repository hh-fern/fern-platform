import React, { useMemo, useState } from "react";

import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import type { ReactNodeViewProps } from "@tiptap/react";
import { ChevronDown, Edit2, Check, X } from "lucide-react";
import Editor from "@monaco-editor/react";

import { cleanLanguage } from "@fern-api/fdr-sdk/api-definition";
import { FernSyntaxHighlighter } from "@fern-docs/components/syntax-highlighter";

import { SearchableDropdown } from "@/components/ui/SearchableDropdown";
import { Button } from "@/components/ui/button";

import { allLanguages } from "./lowlight-languages";

// Map language identifiers to Monaco-compatible language IDs
function getMonacoLanguage(lang: string): string {
    const languageMap: Record<string, string> = {
        yml: "yaml",
        ts: "typescript",
        js: "javascript",
        py: "python",
        rb: "ruby",
        sh: "shell",
        bash: "shell"
    };
    return languageMap[lang] || lang;
}

export function ShikiCodeBlockComponent(props: ReactNodeViewProps) {
    const defaultLanguage = props.node.attrs.language;
    const title = props.node.attrs.title;
    const [searchTerm, setSearchTerm] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [editedCode, setEditedCode] = useState("");

    const code = props.node.textContent;
    const language = cleanLanguage(defaultLanguage || "plaintext");
    const monacoLanguage = getMonacoLanguage(language);

    const handleEdit = () => {
        setEditedCode(code);
        setIsEditing(true);
    };

    const handleSave = () => {
        // Update the node content with the edited code
        const { state } = props.editor;
        const { tr } = state;
        const from = props.getPos();
        const to = from + props.node.nodeSize;

        // Replace the content of the code block
        tr.setNodeMarkup(from, undefined, props.node.attrs);
        tr.insertText(editedCode, from + 1, to - 1);

        props.editor.view.dispatch(tr);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedCode("");
        setIsEditing(false);
    };

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

    // Render with title bar if title is provided
    if (title) {
        return (
            <NodeViewWrapper className="group relative mb-6 mt-4">
                <div className="bg-card-background border-card-border rounded-3 shadow-card-grayscale relative flex w-full min-w-0 max-w-full flex-col border">
                    {/* Title bar */}
                    <div className="bg-(color:--grayscale-a2) rounded-t-[inherit]">
                        <div className="shadow-border-default mx-px flex min-h-10 items-center justify-between shadow-[inset_0_-1px_0_0]">
                            <div className="flex min-h-10 overflow-x-auto">
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
                                    <div className="flex items-center px-3 py-1.5 cursor-pointer">
                                        <span className="text-(color:--grayscale-a11) rounded-1 text-sm font-semibold flex items-center gap-1.5">
                                            {title || currentLanguage?.label || "auto"}
                                            <ChevronDown className="size-3.5 flex-shrink-0 opacity-60" />
                                        </span>
                                    </div>
                                </SearchableDropdown>
                            </div>
                            <div className="flex items-center gap-1 mr-1">
                                {isEditing ? (
                                    <>
                                        <Button onClick={handleSave} size="xs" variant="default">
                                            <Check />
                                            Save
                                        </Button>
                                        <Button onClick={handleCancel} size="xs" variant="outline">
                                            <X />
                                            Cancel
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        onClick={handleEdit}
                                        size="xs"
                                        variant="ghost"
                                        className="opacity-0 group-hover:opacity-100"
                                    >
                                        <Edit2 />
                                        Edit
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Code content */}
                    {isEditing ? (
                        <div className="rounded-b-[inherit] overflow-hidden border-t">
                            <Editor
                                height="300px"
                                language={monacoLanguage}
                                value={editedCode}
                                onChange={(value) => setEditedCode(value || "")}
                                theme="vs"
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 14,
                                    lineNumbers: "on",
                                    scrollBeyondLastLine: false,
                                    automaticLayout: true,
                                    tabSize: 2,
                                    wordWrap: "off"
                                }}
                            />
                        </div>
                    ) : (
                        <FernSyntaxHighlighter
                            language={language}
                            code={code}
                            highlightLines={[]}
                            highlightStyle="highlight"
                            className="rounded-b-[inherit]"
                        />
                    )}
                </div>
            </NodeViewWrapper>
        );
    }

    // Render without title bar (just language selector on hover)
    return (
        <NodeViewWrapper className="group relative mb-6 mt-4">
            <div className="bg-card-background border-card-border rounded-3 shadow-card-grayscale relative border">
                {/* Action buttons */}
                <div className="absolute right-2 top-2 z-20 flex items-center gap-2">
                    {isEditing ? (
                        <>
                            <Button onClick={handleSave} size="xs" variant="default">
                                <Check />
                                Save
                            </Button>
                            <Button onClick={handleCancel} size="xs" variant="outline">
                                <X />
                                Cancel
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                onClick={handleEdit}
                                size="xs"
                                variant="ghost"
                                className="opacity-0 group-hover:opacity-100"
                            >
                                <Edit2 />
                                Edit
                            </Button>
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
                                <button className="flex cursor-pointer items-center gap-1.5 rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 opacity-0 shadow-sm backdrop-blur transition hover:bg-gray-50 group-hover:opacity-100">
                                    <span className="truncate max-w-[100px]">{currentLanguage?.label || "auto"}</span>
                                    <ChevronDown className="size-3.5 flex-shrink-0" />
                                </button>
                            </SearchableDropdown>
                        </>
                    )}
                </div>

                {isEditing ? (
                    <div className="rounded-[inherit] overflow-hidden">
                        <Editor
                            height="300px"
                            language={monacoLanguage}
                            value={editedCode}
                            onChange={(value) => setEditedCode(value || "")}
                            theme="vs"
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                lineNumbers: "on",
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                tabSize: 2,
                                wordWrap: "off"
                            }}
                        />
                    </div>
                ) : (
                    <FernSyntaxHighlighter
                        language={language}
                        code={code}
                        highlightLines={[]}
                        highlightStyle="highlight"
                    />
                )}
            </div>
        </NodeViewWrapper>
    );
}
