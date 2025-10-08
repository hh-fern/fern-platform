"use client";

import { useMemo, useState, useRef, useEffect } from "react";

import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import type { ReactNodeViewProps } from "@tiptap/react";
import {
    ChevronDown,
    Code2,
    FileJson,
    FileText,
    Database,
    Palette,
    Terminal,
    Blocks
} from "lucide-react";

import { cleanLanguage } from "@fern-api/fdr-sdk/api-definition";
import { FernSyntaxHighlighter } from "@fern-docs/components/syntax-highlighter";

import { SearchableDropdown } from "@/components/ui/SearchableDropdown";
import { Mermaid } from "@/docs/mdx/components/mermaid";

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
        bash: "shell",
        plaintext: "plaintext",
        txt: "plaintext",
        text: "plaintext"
    };

    // Return mapped language or original if it's a valid Monaco language
    const mapped = languageMap[lang.toLowerCase()];
    if (mapped) {
        return mapped;
    }

    // Common Monaco languages that don't need mapping
    const validMonacoLanguages = [
        "javascript",
        "typescript",
        "python",
        "java",
        "c",
        "cpp",
        "csharp",
        "go",
        "rust",
        "php",
        "ruby",
        "swift",
        "kotlin",
        "dart",
        "scala",
        "html",
        "css",
        "scss",
        "less",
        "json",
        "xml",
        "yaml",
        "markdown",
        "sql",
        "shell",
        "powershell",
        "dockerfile",
        "makefile",
        "plaintext"
    ];

    if (validMonacoLanguages.includes(lang.toLowerCase())) {
        return lang.toLowerCase();
    }

    // Default to plaintext if language is not recognized
    console.log(`Unknown language for Monaco: ${lang}, defaulting to plaintext`);
    return "plaintext";
}

// Get Lucide icon component for language
function getLanguageIcon(lang: string): React.ComponentType<any> {
    const iconMap: Record<string, React.ComponentType<any>> = {
        javascript: Code2,
        typescript: Code2,
        python: Code2,
        java: Code2,
        ruby: Code2,
        rust: Code2,
        go: Code2,
        php: Code2,
        swift: Code2,
        kotlin: Code2,
        csharp: Code2,
        cpp: Code2,
        c: Code2,
        shell: Terminal,
        bash: Terminal,
        yaml: FileText,
        yml: FileText,
        json: FileJson,
        xml: FileText,
        html: Blocks,
        css: Palette,
        scss: Palette,
        sql: Database,
        markdown: FileText,
        plaintext: FileText
    };
    return iconMap[lang.toLowerCase()] || FileText;
}

// Monaco Editor component using modern-monaco
function ModernMonacoEditor({
    value,
    language,
    onChange,
    height = "300px"
}: {
    value: string;
    language: string;
    onChange: (value: string) => void;
    height?: string;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorInstanceRef = useRef<any>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        let mounted = true;

        // Dynamically import monaco
        import("modern-monaco").then((monaco) => {
            if (!mounted || !containerRef.current) return;

            // Create editor instance
            const editor = monaco.editor.create(containerRef.current, {
                value,
                language,
                theme: "min-light",
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: "off",
                padding: { top: 16, bottom: 16 }
            });

            editorInstanceRef.current = { editor, monaco };

            // Listen for content changes
            editor.onDidChangeModelContent(() => {
                onChange(editor.getValue());
            });
        });

        // Cleanup on unmount
        return () => {
            mounted = false;
            if (editorInstanceRef.current) {
                editorInstanceRef.current.editor.dispose();
            }
        };
    }, []);

    // Update value when prop changes
    useEffect(() => {
        if (editorInstanceRef.current && editorInstanceRef.current.editor.getValue() !== value) {
            editorInstanceRef.current.editor.setValue(value);
        }
    }, [value]);

    // Update language when prop changes
    useEffect(() => {
        if (editorInstanceRef.current) {
            const model = editorInstanceRef.current.editor.getModel();
            if (model && editorInstanceRef.current.monaco) {
                editorInstanceRef.current.monaco.editor.setModelLanguage(model, language);
            }
        }
    }, [language]);

    return <div ref={containerRef} style={{ height, width: "100%" }} />;
}

export function ShikiCodeBlockComponent(props: ReactNodeViewProps) {
    const defaultLanguage = props.node.attrs.language;
    const title = props.node.attrs.title;
    const [searchTerm, setSearchTerm] = useState("");

    const code = props.node.textContent;
    const language = cleanLanguage(defaultLanguage || "plaintext");
    const monacoLanguage = getMonacoLanguage(language);

    const handleCodeChange = (value: string) => {
        // Update the node content with the new code
        const { state } = props.editor;
        const { tr } = state;
        const from = props.getPos();
        const to = from + props.node.nodeSize;

        // Replace the content of the code block
        tr.setNodeMarkup(from, undefined, props.node.attrs);
        tr.insertText(value, from + 1, to - 1);

        props.editor.view.dispatch(tr);
    };

    const languages = useMemo(() => {
        const filteredLanguages = searchTerm
            ? allLanguages.filter((lang: string) => lang.toLowerCase().includes(searchTerm.toLowerCase()))
            : allLanguages;

        return [
            { value: "null", label: "auto", Icon: Code2 },
            { value: "disabled", label: "—", disabled: true },
            ...filteredLanguages.map((lang: string) => ({
                value: lang,
                label: lang,
                Icon: getLanguageIcon(lang)
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
                                            className={`flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-gray-200 hover:transition-none focus:bg-gray-200 focus:outline-none ${
                                                language.disabled ? "cursor-not-allowed opacity-50" : ""
                                            }`}
                                            onClick={() => !language.disabled && onSelect()}
                                        >
                                            {language.Icon && <language.Icon className="size-4 text-gray-600" />}
                                            <span>{language.label}</span>
                                        </div>
                                    )}
                                >
                                    <div className="flex items-center px-3 py-1.5 cursor-pointer">
                                        <span className="text-(color:--grayscale-a11) rounded-1 text-sm font-semibold flex items-center gap-1.5">
                                            {currentLanguage?.Icon && <currentLanguage.Icon className="size-4" />}
                                            {title || currentLanguage?.label || "auto"}
                                            <ChevronDown className="size-3.5 flex-shrink-0 opacity-60" />
                                        </span>
                                    </div>
                                </SearchableDropdown>
                            </div>
                        </div>
                    </div>

                    {/* Code content - always editable */}
                    {language === "mermaid" ? (
                        <div className="p-6 rounded-b-[inherit]">
                            <Mermaid>{code}</Mermaid>
                        </div>
                    ) : (
                        <div className="rounded-b-[inherit] overflow-hidden">
                            <ModernMonacoEditor
                                height="300px"
                                language={monacoLanguage}
                                value={code}
                                onChange={handleCodeChange}
                            />
                        </div>
                    )}
                </div>
            </NodeViewWrapper>
        );
    }

    // Render without title bar (just language selector on hover)
    return (
        <NodeViewWrapper className="group relative mb-6 mt-4">
            <div className="bg-card-background border-card-border rounded-3 shadow-card-grayscale relative border">
                {/* Language selector */}
                <div className="absolute right-2 top-2 z-20 flex items-center gap-2">
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
                                className={`flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-gray-200 hover:transition-none focus:bg-gray-200 focus:outline-none ${
                                    language.disabled ? "cursor-not-allowed opacity-50" : ""
                                }`}
                                onClick={() => !language.disabled && onSelect()}
                            >
                                {language.Icon && <language.Icon className="size-4 text-gray-600" />}
                                <span>{language.label}</span>
                            </div>
                        )}
                    >
                        <button className="flex cursor-pointer items-center gap-1.5 rounded border border-gray-300 bg-white px-2 py-1 text-sm font-medium text-gray-900 shadow-sm backdrop-blur transition hover:bg-gray-50">
                            {currentLanguage?.Icon && <currentLanguage.Icon className="size-4" />}
                            <span className="truncate max-w-[100px]">{currentLanguage?.label || "auto"}</span>
                            <ChevronDown className="size-3.5 flex-shrink-0" />
                        </button>
                    </SearchableDropdown>
                </div>

                {/* Code content - always editable */}
                {language === "mermaid" ? (
                    <div className="p-6 rounded-[inherit]">
                        <Mermaid>{code}</Mermaid>
                    </div>
                ) : (
                    <div className="rounded-[inherit] overflow-hidden">
                        <ModernMonacoEditor
                            height="300px"
                            language={monacoLanguage}
                            value={code}
                            onChange={handleCodeChange}
                        />
                    </div>
                )}
            </div>
        </NodeViewWrapper>
    );
}
