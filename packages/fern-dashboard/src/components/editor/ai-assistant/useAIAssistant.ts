"use client";

import { useCallback, useState } from "react";

export interface AIAssistantConfig {
  currentContent?: string;
  pageContext?: string;
}

export interface GeneratedContentResponse {
  content: string;
  placement: string;
}

export function useAIAssistant(config: AIAssistantConfig = {}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] =
    useState<GeneratedContentResponse | null>(null);

  const generateContent = useCallback(
    async (
      prompt: string,
      chatHistory: any[] = [],
      latestContent?: string
    ): Promise<{
      success: boolean;
      content?: GeneratedContentResponse;
      error?: string;
      note?: string;
    }> => {
      if (!prompt.trim()) {
        return { success: false, error: "Please enter a prompt" };
      }

      setIsGenerating(true);
      setGeneratedContent(null);

      try {
        const response = await fetch("/api/ai-assistant/generate-content", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: prompt.trim(),
            currentContent: latestContent || config.currentContent,
            pageContext: config.pageContext,
            chatHistory,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();

        // Handle AI error responses
        if (data.success === false) {
          return {
            success: false,
            error: data.error || "AI could not fulfill the request",
          };
        }

        if (!data.content) {
          return { success: false, error: "No content generated" };
        }

        const result = {
          content: data.content,
          placement: data.placement || "cursor",
        };

        setGeneratedContent(result);

        return { success: true, content: result, note: data.note };
      } catch (error) {
        console.error("Error generating content:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        return {
          success: false,
          error: `Failed to generate content: ${errorMessage}`,
        };
      } finally {
        setIsGenerating(false);
      }
    },
    [config.currentContent, config.pageContext]
  );

  const clearGeneratedContent = useCallback(() => {
    setGeneratedContent(null);
  }, []);

  return {
    generateContent,
    isGenerating,
    generatedContent,
    clearGeneratedContent,
  };
}
