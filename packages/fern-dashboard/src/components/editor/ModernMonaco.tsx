"use client";

import { useEffect, useRef } from "react";

export interface ModernMonacoProps {
    /** The code content to display in the editor */
    value?: string;
    /** The programming language for syntax highlighting (e.g., "javascript", "typescript", "python") */
    language?: string;
    /** Callback when the editor content changes */
    onChange?: (value: string) => void;
    /** Height of the editor container. Default is "400px" */
    height?: string;
    /** Editor theme - uses Fern docs theme by default */
    theme?: string;
    /** Additional CSS class name for the container */
    className?: string;
    /** Whether the editor is read-only. Default is false */
    readOnly?: boolean;
}

/**
 * ModernMonaco - A simple wrapper around modern-monaco editor
 *
 * This component provides a Monaco editor with Shiki syntax highlighting
 * using the same themes as Fern docs (material-theme-darker for dark mode,
 * min-light for light mode).
 *
 * @example
 * ```tsx
 * <ModernMonaco
 *   value="console.log('Hello, world!');"
 *   language="javascript"
 *   onChange={(value) => console.log(value)}
 *   height="500px"
 * />
 * ```
 */
export function ModernMonaco({
    value = "",
    language = "javascript",
    onChange,
    height = "400px",
    theme,
    className = "",
    readOnly = false
}: ModernMonacoProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<any>(null);
    const monacoRef = useRef<any>(null);

    useEffect(() => {
        let mounted = true;

        const initEditor = async () => {
            if (!containerRef.current) return;

            try {
                // Dynamically import modern-monaco
                const { init } = await import("modern-monaco");

                if (!mounted) return;

                // Initialize monaco
                const monaco = await init();
                monacoRef.current = monaco;

                if (!mounted || !containerRef.current) return;

                // Determine theme based on current dark mode
                // Uses same themes as Fern docs
                const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                const defaultTheme = theme || (isDark ? "material-theme-darker" : "min-light");

                // Create editor instance
                const editor = monaco.editor.create(containerRef.current, {
                    value,
                    language,
                    theme: defaultTheme,
                    readOnly,
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: "on",
                    roundedSelection: false,
                    scrollBeyondLastLine: false,
                    automaticLayout: true
                });

                editorRef.current = editor;

                // Setup onChange listener
                if (onChange) {
                    editor.onDidChangeModelContent(() => {
                        const currentValue = editor.getValue();
                        onChange(currentValue);
                    });
                }
            } catch (error) {
                console.error("Failed to initialize ModernMonaco:", error);
            }
        };

        void initEditor();

        return () => {
            mounted = false;
            if (editorRef.current) {
                editorRef.current.dispose();
                editorRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount - we handle prop updates in separate effects

    // Update value when prop changes
    useEffect(() => {
        if (editorRef.current && value !== undefined) {
            const currentValue = editorRef.current.getValue();
            if (currentValue !== value) {
                editorRef.current.setValue(value);
            }
        }
    }, [value]);

    // Update language when prop changes
    useEffect(() => {
        if (editorRef.current && monacoRef.current && language) {
            const model = editorRef.current.getModel();
            if (model) {
                monacoRef.current.editor.setModelLanguage(model, language);
            }
        }
    }, [language]);

    // Update readOnly when prop changes
    useEffect(() => {
        if (editorRef.current) {
            editorRef.current.updateOptions({ readOnly });
        }
    }, [readOnly]);

    return <div ref={containerRef} className={className} style={{ height, width: "100%" }} />;
}
