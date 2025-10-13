import { useEffect, useRef, useState } from "react";
import type React from "react";

import { cleanLanguage } from "@fern-api/fdr-sdk/api-definition";
import { CopyToClipboardButton } from "@fern-docs/components/CopyToClipboardButton";
import { cn } from "@fern-docs/components/cn";

import { useIsDarkCode } from "@/docs/state/dark-code";

import { applyTemplates, useTemplate } from "./Template";

// Helper function to find the code element that TipTap is managing
// This searches for a pre > code element that contains the iframe
function findCodeElementForIframe(iframe: HTMLIFrameElement): HTMLElement | null {
    // Walk up the DOM tree from the iframe to find the nearest pre > code element
    let parent = iframe.parentElement;
    while (parent) {
        // Check if this parent has a pre > code sibling or is itself a code container
        const codeElement = parent.querySelector("pre > code");
        if (codeElement instanceof HTMLElement) {
            return codeElement;
        }
        parent = parent.parentElement;
    }
    return null;
}

export function CodeBlock(props: {
    className?: string;
    /**
     * @default "plaintext"
     */
    language?: string;
    /**
     * overrides language for setting the global language state
     * @default language
     */
    for?: string;
    /**
     * @default ""
     */
    code?: string;
    /**
     * sets the lines to highlight
     */
    highlight?: number | number[];
    /**
     * sets the lines to focus
     */
    focus?: number | number[];
    title?: string;
    filename?: string;
    maxLines?: number;
    wordWrap?: boolean;
    /**
     * replaces handlebars in the code with the given values, i.e. {{API_KEY}} -> "1234567890"
     */
    template?: Record<string, string>;
    /**
     * enables rendering tooltips on handlebars in the code
     */
    tooltips?: Record<string, React.ReactNode>;
}) {
    const {
        className,
        code = "",
        title,
        filename,
        language = "plaintext",
        template: templateProp,
        maxLines = 20
    } = props;
    const isDarkCode = useIsDarkCode();

    // merge context templates with the ones passed in
    const template = { ...useTemplate().template, ...templateProp };

    // Track editable code from iframe
    const [editableCode, setEditableCode] = useState(code);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Sync editableCode when the code prop changes (e.g., from TipTap undo/redo)
    useEffect(() => {
        setEditableCode(code);
    }, [code]);

    useEffect(() => {
        // Listen for messages from the iframe
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === "monaco-value-change") {
                const newCode = event.data.value;
                setEditableCode(newCode);

                // Find the code element in the DOM that corresponds to this CodeBlock
                // and update it so TipTap can detect the change
                if (iframeRef.current) {
                    const codeElement = findCodeElementForIframe(iframeRef.current);
                    if (codeElement) {
                        codeElement.textContent = newCode;
                        // Trigger input event to notify TipTap of the change
                        const inputEvent = new Event("input", { bubbles: true });
                        codeElement.dispatchEvent(inputEvent);
                    }
                }
            }
        };

        window.addEventListener("message", handleMessage);

        return () => {
            window.removeEventListener("message", handleMessage);
        };
    }, []);

    if (!code) {
        return null;
    }

    const processedCode = applyTemplates(editableCode, template);
    const cleanedLanguage = cleanLanguage(language);

    // Calculate height based on maxLines
    const lineCount = editableCode.split("\n").length;
    const displayLines = Math.min(lineCount, maxLines);
    const height = Math.max(displayLines * 22 + 40, 100); // 22px per line + padding, min 100px

    const theme = isDarkCode ? "material-theme-darker" : "min-light";
    const iframeSrc = `/api/monaco-editor?code=${encodeURIComponent(editableCode)}&language=${cleanedLanguage}&theme=${theme}&readOnly=false`;

    if (title || filename) {
        return (
            <div
                className={cn(
                    "bg-card-background border-card-border rounded-3 shadow-card-grayscale relative mb-6 mt-4 flex w-full min-w-0 max-w-full flex-col border first:mt-0",
                    { "bg-card-solid dark": isDarkCode }
                )}
            >
                <div className="bg-(color:--grayscale-a2) rounded-t-[inherit]">
                    <div className="shadow-border-default mx-px flex min-h-10 items-center justify-between shadow-[inset_0_-1px_0_0]">
                        <div className="flex min-h-10 overflow-x-auto">
                            <div className="flex items-center px-3 py-1.5">
                                <span className="text-(color:--grayscale-a11) rounded-1 text-sm font-semibold">
                                    {title ?? language}
                                </span>
                            </div>
                        </div>
                        <CopyToClipboardButton className="ml-2 mr-1" content={() => processedCode} />
                    </div>
                </div>
                <iframe
                    key={`${cleanedLanguage}-titled`}
                    ref={iframeRef}
                    src={iframeSrc}
                    className="w-full rounded-b-[inherit] border-0"
                    style={{ height: `${height}px` }}
                    title={`Code editor for ${cleanedLanguage}`}
                />
            </div>
        );
    }

    return (
        <div className={cn("relative", { "bg-card-solid dark": isDarkCode }, className)}>
            <CopyToClipboardButton className="absolute right-2 top-2 z-10" content={() => processedCode} />
            <iframe
                key={`${cleanedLanguage}-untitled`}
                ref={iframeRef}
                src={iframeSrc}
                className="w-full rounded border-0"
                style={{ height: `${height}px` }}
                title={`Code editor for ${cleanedLanguage}`}
            />
        </div>
    );
}
