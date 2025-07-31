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
  }
}

export function AIAssistant({
  currentHtml,
  pageContext,
  className,
  onContentGenerated,
  getCurrentContent,
}: AIAssistant.Props) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

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
      return { success: true, note: result.note };
    } else {
      return { success: false, error: result.error };
    }
  };

  return (
    <>
      <FloatingAIButton
        onClick={() => setIsPanelOpen(true)}
        className={className}
      />
      <AISidePanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onGenerateContent={handleGenerateContent}
        isGenerating={isGenerating}
      />
    </>
  );
}
