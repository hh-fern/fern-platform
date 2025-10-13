import { useEffect, useRef, useState } from "react";
import type React from "react";

import * as Tabs from "@radix-ui/react-tabs";

import { cleanLanguage } from "@fern-api/fdr-sdk/api-definition";
import { CopyToClipboardButton } from "@fern-docs/components/CopyToClipboardButton";
import { cn } from "@fern-docs/components/cn";

import { HorizontalOverflowMask } from "@/docs/components/HorizontalOverflowMask";
import { getLanguageDisplayName } from "@/docs/components/api-reference/examples/code-example";
import { unwrapChildren } from "@/docs/mdx/common/unwrap-children";
import { useIsDarkCode } from "@/docs/state/dark-code";
import { useProgrammingLanguage } from "@/docs/state/language";

import { CodeBlock } from "./CodeBlock";
import { Template, applyTemplates, useTemplate } from "./Template";

// Helper function to find the code element that TipTap is managing
function findCodeElementForIframe(iframe: HTMLIFrameElement): HTMLElement | null {
    let parent = iframe.parentElement;
    while (parent) {
        const codeElement = parent.querySelector("pre > code");
        if (codeElement instanceof HTMLElement) {
            return codeElement;
        }
        parent = parent.parentElement;
    }
    return null;
}

export function CodeGroup({
    children,
    template: templateProp,
    tooltips: tooltipsProp
}: {
    children: React.ReactNode;
    template?: Record<string, string>;
    tooltips?: Record<string, React.ReactNode>;
}) {
    const isDarkCode = useIsDarkCode();

    const items = unwrapChildren(children, CodeBlock);
    const template = { ...useTemplate().template, ...templateProp };
    const tooltips = { ...useTemplate().tooltips, ...tooltipsProp };

    const [selectedTabIndex, setSelectedTabIndex] = useState(0);
    const [selectedLanguage, setSelectedLanguage] = useProgrammingLanguage();
    const itemsRef = useRef(items);
    itemsRef.current = items;

    // Track editable state for each tab
    const [editableCodes, setEditableCodes] = useState<string[]>(items.map((item) => item.props.code ?? ""));

    const iframeRefs = useRef<(HTMLIFrameElement | null)[]>([]);

    // Sync editableCodes when items change (e.g., from TipTap undo/redo)
    useEffect(() => {
        setEditableCodes(items.map((item) => item.props.code ?? ""));
    }, [items.map((item) => item.props.code).join(",")]);

    useEffect(() => {
        // Listen for messages from iframes
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === "monaco-value-change") {
                const newCode = event.data.value;

                // Update the code for the currently selected tab
                setEditableCodes((prev) => {
                    const newCodes = [...prev];
                    newCodes[selectedTabIndex] = newCode;
                    return newCodes;
                });

                // Find and update the code element in the DOM for TipTap
                const currentIframe = iframeRefs.current[selectedTabIndex];
                if (currentIframe) {
                    const codeElement = findCodeElementForIframe(currentIframe);
                    if (codeElement) {
                        codeElement.textContent = newCode;
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
    }, [selectedTabIndex]);

    useEffect(() => {
        if (selectedLanguage) {
            const matchingTab = itemsRef.current.find((item) => {
                const matchLanguage = item.props.for || item.props.language;
                const normalizedLanguage = cleanLanguage(matchLanguage ?? "plaintext");
                return normalizedLanguage === selectedLanguage;
            });

            if (matchingTab) {
                const newIndex = itemsRef.current.indexOf(matchingTab);
                setSelectedTabIndex((prevIndex) => {
                    const prevTab = itemsRef.current[prevIndex];
                    const prevMatchLanguage = prevTab?.props.for || prevTab?.props.language;
                    const normalizedPrevLanguage = cleanLanguage(prevMatchLanguage ?? "plaintext");
                    if (normalizedPrevLanguage === selectedLanguage) {
                        return prevIndex;
                    }
                    return newIndex;
                });
            }
        }
    }, [selectedLanguage]);

    if (items.length === 0) {
        return null;
    }

    const handleTabChange = (value: string) => {
        const newIndex = parseInt(value, 10);
        setSelectedTabIndex(newIndex);

        const tab = itemsRef.current[newIndex];
        const matchLanguage = tab?.props.for || tab?.props.language;
        const normalizedLanguage = matchLanguage ? cleanLanguage(matchLanguage) : undefined;

        if (normalizedLanguage && normalizedLanguage !== selectedLanguage) {
            setSelectedLanguage(normalizedLanguage);
        }
    };

    const getDisplayNameWithCount = (
        language: string | undefined,
        items: React.ReactElement<React.ComponentProps<typeof CodeBlock>>[],
        currentIndex: number
    ): string => {
        const normalizedLanguage = cleanLanguage(language ?? "");
        const displayName = getLanguageDisplayName(normalizedLanguage);
        const sameLanguageCount = items
            .slice(0, currentIndex)
            .filter((i) => cleanLanguage(i.props.language ?? "") === normalizedLanguage).length;
        return sameLanguageCount > 0 ? `${displayName} ${sameLanguageCount}` : displayName;
    };

    if (items.length === 1 && items[0] != null) {
        return (
            <Template data={template} tooltips={tooltips}>
                {items[0]}
            </Template>
        );
    }

    const selectedItem = items[selectedTabIndex];
    const code = editableCodes[selectedTabIndex] ?? "";
    const processedCode = applyTemplates(code, template);

    const theme = isDarkCode ? "material-theme-darker" : "min-light";

    return (
        <Tabs.Root
            className={cn(
                "bg-card-background after:ring-card-border rounded-3 shadow-card-grayscale relative mb-6 mt-4 flex w-full min-w-0 max-w-full flex-col after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:ring-1 after:ring-inset after:content-[''] first:mt-0",
                { "bg-card-solid dark": isDarkCode }
            )}
            onValueChange={handleTabChange}
            value={selectedTabIndex.toString()}
        >
            <div className="bg-(color:--grayscale-a2) rounded-t-[inherit]">
                <div className="shadow-border-default mx-px flex min-h-10 items-center justify-between shadow-[inset_0_-1px_0_0]">
                    <Tabs.List className="flex min-h-10" asChild>
                        <HorizontalOverflowMask>
                            {items.map((item, idx) => {
                                const { filename, title = filename, language } = item.props;
                                return (
                                    <Tabs.Trigger
                                        key={idx}
                                        value={idx.toString()}
                                        className="data-[state=active]:shadow-(color:--accent) group flex min-h-10 items-center px-2 py-1.5 data-[state=active]:shadow-[inset_0_-2px_0_0_rgba(0,0,0,0.1)]"
                                    >
                                        <span className="text-(color:--grayscale-a11) group-data-[state=active]:text-body group-hover:bg-(color:--grayscale-a3) rounded-1 whitespace-nowrap px-2 py-1 text-sm group-data-[state=active]:font-semibold">
                                            {title ?? getDisplayNameWithCount(language, items, idx)}
                                        </span>
                                    </Tabs.Trigger>
                                );
                            })}
                        </HorizontalOverflowMask>
                    </Tabs.List>

                    <CopyToClipboardButton className="ml-2 mr-1" content={() => processedCode} />
                </div>
            </div>
            {items.map((item, idx) => {
                const itemCode = editableCodes[idx] ?? item.props.code ?? "";
                const itemLanguage = cleanLanguage(item.props.language ?? "plaintext");
                const itemMaxLines = item.props.maxLines ?? 20;
                const itemLineCount = itemCode.split("\n").length;
                const itemDisplayLines = Math.min(itemLineCount, itemMaxLines);
                const itemHeight = Math.max(itemDisplayLines * 22 + 40, 100);

                const iframeSrc = `/api/monaco-editor?code=${encodeURIComponent(itemCode)}&language=${itemLanguage}&theme=${theme}&readOnly=false`;

                return (
                    <Tabs.Content
                        value={idx.toString()}
                        key={idx}
                        className="rounded-b-[inherit] rounded-t-none"
                    >
                        <iframe
                            key={`${itemLanguage}-${idx}`}
                            ref={(el) => {
                                iframeRefs.current[idx] = el;
                            }}
                            src={iframeSrc}
                            className="w-full rounded-b-[inherit] border-0"
                            style={{ height: `${itemHeight}px` }}
                            title={`Code editor for ${itemLanguage}`}
                        />
                    </Tabs.Content>
                );
            })}
        </Tabs.Root>
    );
}
