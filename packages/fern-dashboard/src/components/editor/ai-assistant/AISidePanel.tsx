"use client";

import React, { useState } from "react";

import { Bot, Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/utils/utils";

export interface ChatMessage {
  role: "user" | "assistant" | "error";
  content: string;
  timestamp: number;
}

export declare namespace AISidePanel {
  export interface Props {
    isOpen: boolean;
    onClose: () => void;
    onGenerateContent: (
      prompt: string,
      chatHistory: ChatMessage[]
    ) => Promise<{
      success: boolean;
      error?: string;
      note?: string;
    }>;
    isGenerating?: boolean;
    className?: string;
  }
}

export function AISidePanel({
  isOpen,
  onClose,
  onGenerateContent,
  isGenerating = false,
  className,
}: AISidePanel.Props) {
  const [prompt, setPrompt] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: prompt.trim(),
      timestamp: Date.now(),
    };

    // Add user message to chat history
    const updatedHistory = [...chatHistory, userMessage];
    setChatHistory(updatedHistory);

    const result = await onGenerateContent(prompt.trim(), updatedHistory);

    if (result.success) {
      // Add successful assistant response to history
      const successMessage = result.note
        ? `✅ Content added successfully. Note: ${result.note}`
        : "✅ Content added successfully";

      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: successMessage,
          timestamp: Date.now(),
        },
      ]);
      setPrompt("");
    } else {
      // Add error message to history and keep panel open
      setChatHistory((prev) => [
        ...prev,
        {
          role: "error",
          content: result.error || "Failed to generate content",
          timestamp: Date.now(),
        },
      ]);
      // Don't clear the prompt on error so user can try again
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed inset-y-0 right-0 z-50 w-96 border-l border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900",
        "transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full",
        className
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Bot className="text-primary h-5 w-5" />
            <h2 className="text-lg font-semibold">AI Content Assistant</h2>
          </div>
          <Button
            variant="ghost"
            size="iconSm"
            onClick={onClose}
            aria-label="Close AI Assistant"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 p-4">
          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Describe what content you would like to generate for this page.
              The AI is aware of your current page content and previous
              conversation.
            </p>
          </div>

          {/* Chat History */}
          {chatHistory.length > 0 && (
            <div className="mb-4 max-h-40 overflow-y-auto rounded-md border bg-gray-50 p-3 dark:bg-gray-800">
              <h4 className="mb-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                Conversation History
              </h4>
              <div className="space-y-2">
                {chatHistory.map((message, index) => (
                  <div key={index} className="text-xs">
                    <span
                      className={cn(
                        "font-medium",
                        message.role === "user" &&
                          "text-blue-600 dark:text-blue-400",
                        message.role === "assistant" &&
                          "text-green-600 dark:text-green-400",
                        message.role === "error" &&
                          "text-red-600 dark:text-red-400"
                      )}
                    >
                      {message.role === "user"
                        ? "You"
                        : message.role === "error"
                          ? "Error"
                          : "AI"}
                      :
                    </span>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">
                      {message.content}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div>
              <label htmlFor="ai-prompt" className="sr-only">
                Content generation prompt
              </label>
              <textarea
                id="ai-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., 'Add a getting started section with installation steps' or 'Create an API reference for authentication endpoints'"
                className={cn(
                  "min-h-[120px] w-full rounded-md border border-gray-200 p-3 dark:border-gray-700",
                  "bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100",
                  "focus:ring-primary focus:border-transparent focus:ring-2",
                  "resize-none placeholder:text-gray-500 dark:placeholder:text-gray-400"
                )}
                disabled={isGenerating}
              />
            </div>

            <Button
              type="submit"
              disabled={!prompt.trim() || isGenerating}
              loading={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                "Generating content..."
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Generate Content
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 space-y-2">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Suggested prompts:
            </h3>
            <div className="space-y-1">
              {[
                "Add a card group with 3 feature cards",
                "Create a step-by-step tutorial with numbered steps",
                "Add a troubleshooting accordion with common issues",
                "Generate code examples with multiple languages",
                "Add a getting started section with installation steps",
                "Create a comparison table of different options",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setPrompt(suggestion)}
                  disabled={isGenerating}
                  className={cn(
                    "w-full rounded border border-gray-200 p-2 text-left text-xs dark:border-gray-700",
                    "transition-colors hover:bg-gray-50 dark:hover:bg-gray-800",
                    "disabled:cursor-not-allowed disabled:opacity-50"
                  )}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
