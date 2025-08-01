"use client";

import React, { useState } from "react";

import { AISidePanel } from "./AISidePanel";
import { FloatingAIButton } from "./FloatingAIButton";
import { useAIAssistant } from "./useAIAssistant";

export declare namespace AIAssistant {
  export interface Props {
    currentHtml?: string;
    pageContext?: string;
    className?: string;
    onContentGenerated?: (response: {
      content: string;
      placement: string;
    }) => void;
    getCurrentContent?: () => string;
    isOpen?: boolean;
    onToggle?: () => void;
  }
}

export function AIAssistant({
  currentHtml,
  pageContext,
  className,
  onContentGenerated,
  getCurrentContent,
  isOpen,
  onToggle,
}: AIAssistant.Props) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Use external state if provided, otherwise use internal state
  const panelOpen = isOpen !== undefined ? isOpen : isPanelOpen;
  const togglePanel = onToggle || (() => setIsPanelOpen(!isPanelOpen));

  // Add/remove CSS class on body to push content when panel is open
  React.useEffect(() => {
    if (panelOpen) {
      document.body.classList.add("ai-panel-open");
    } else {
      document.body.classList.remove("ai-panel-open");
    }

    return () => {
      document.body.classList.remove("ai-panel-open");
    };
  }, [panelOpen]);

  const { generateContent, isGenerating } = useAIAssistant({
    currentContent: currentHtml,
    pageContext,
  });

  const handleGenerateContent = async (prompt: string, chatHistory: any[]) => {
    // Get the latest content from the editor
    const latestContent = getCurrentContent ? getCurrentContent() : currentHtml;

    const result = await generateContent(prompt, chatHistory, latestContent);

    if (result.success && result.content && onContentGenerated) {
      onContentGenerated(result.content);
      return { success: true, summary: result.summary };
    } else {
      return { success: false, error: result.error };
    }
  };

  return (
    <>
      <FloatingAIButton
        onClick={togglePanel}
        isOpen={panelOpen}
        className={className}
      />
      <AISidePanel
        isOpen={panelOpen}
        onClose={() => panelOpen && togglePanel()}
        onGenerateContent={handleGenerateContent}
        isGenerating={isGenerating}
      />
    </>
  );
}
