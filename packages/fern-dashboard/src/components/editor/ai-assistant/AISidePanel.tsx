"use client";

import React, { useEffect, useRef, useState } from "react";

import { ArrowUp } from "lucide-react";

import { FernLogo } from "@fern-docs/components";

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
  onGenerateContent,
  isGenerating = false,
  className,
}: AISidePanel.Props) {
  const [prompt, setPrompt] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [showContent, setShowContent] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle animation timing
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isOpen) {
      // Delay showing content until slide-in animation completes (300ms)
      timer = setTimeout(() => {
        setShowContent(true);
      }, 300);
    } else {
      // Hide content immediately when closing
      setShowContent(false);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [isOpen]);

  // Function to auto-resize textarea
  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  };

  // Handle setting prompt and auto-resize
  const handleSetPrompt = (text: string) => {
    setPrompt(text);
    // Use setTimeout to ensure the DOM is updated before resizing
    setTimeout(autoResizeTextarea, 0);
  };

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
    setPrompt("");

    // Add thinking state immediately after user message
    const thinkingMessage: ChatMessage = {
      role: "assistant",
      content: "thinking",
      timestamp: Date.now(),
    };
    setChatHistory((prev) => [...prev, thinkingMessage]);

    const result = await onGenerateContent(prompt.trim(), updatedHistory);

    // Remove thinking message and add actual response
    setChatHistory((prev) => prev.slice(0, -1));

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
    }
  };

  return (
    <div
      className={cn(
        "fixed right-0 z-10 w-96 bg-transparent",
        "transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full",
        className
      )}
      style={{
        top: "calc(var(--header-height) + var(--header-toolbar-height) - 32px)",
        bottom: 0,
        right: 0,
      }}
    >
      <div className="flex h-full flex-col justify-center">
        <div
          className={cn(
            "transition-opacity duration-300 ease-in-out",
            showContent ? "opacity-100" : "opacity-0"
          )}
        >
          {isOpen && (
            <>
              {/* Fixed Header */}
              <div className="flex flex-shrink-0 items-center justify-center p-4 pt-16">
                <div className="flex items-end gap-2">
                  <FernLogo className="w-23 mb-1.5" />
                  <p className="text-muted-foreground mb-0 mt-0 text-lg">
                    Writer
                  </p>
                </div>
              </div>

              {/* Scrollable Chat History */}
              {chatHistory.length !== 0 && (
                <div className="flex min-h-0 flex-1 flex-col">
                  <div className="flex-1 space-y-4 overflow-y-auto p-4">
                    {chatHistory.map((message, index) => (
                      <div
                        key={index}
                        className={cn(
                          "flex items-start gap-3",
                          message.role === "user"
                            ? "flex-row-reverse"
                            : "flex-row"
                        )}
                      >
                        {/* Avatar */}
                        {(message.role === "assistant" ||
                          message.role === "error") && (
                          <div
                            className={cn(
                              "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
                              message.role === "error"
                                ? "bg-red-500"
                                : "bg-white"
                            )}
                          >
                            {message.role === "assistant" ? (
                              <FernLogo className="h-4 w-4 text-white" />
                            ) : (
                              <span className="text-sm font-medium text-white">
                                !
                              </span>
                            )}
                          </div>
                        )}

                        {/* Message Bubble */}
                        <div
                          className={cn(
                            "max-w-[240px] rounded-2xl px-4 py-2 text-sm",
                            message.role === "user"
                              ? "text-gray-1100 bg-green-300"
                              : message.role === "error"
                                ? "bg-red-500 text-white"
                                : "border border-gray-200 bg-white text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                          )}
                        >
                          {message.content === "thinking" ? (
                            <div className="flex items-center gap-2 py-1.5">
                              <div className="flex space-x-1">
                                <div className="h-1 w-1 animate-bounce rounded-full bg-gray-500 [animation-delay:-0.3s]"></div>
                                <div className="h-1 w-1 animate-bounce rounded-full bg-gray-500 [animation-delay:-0.15s]"></div>
                                <div className="h-1 w-1 animate-bounce rounded-full bg-gray-500"></div>
                              </div>
                            </div>
                          ) : (
                            message.content
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Message Input - Fixed at bottom */}
              <div className="flex-shrink-0 p-4">
                <form
                  onSubmit={(e) => void handleSubmit(e)}
                  className="flex items-center gap-2"
                >
                  <div className="flex flex-1">
                    <label htmlFor="ai-prompt" className="sr-only">
                      Content generation prompt
                    </label>
                    <textarea
                      ref={textareaRef}
                      id="ai-prompt"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Ask Fern to write your docs..."
                      className={cn(
                        "w-full rounded-2xl border border-gray-400 bg-white p-3",
                        "focus:ring-primary focus:border-primary focus:outline-none",
                        "resize-none placeholder:text-gray-700",
                        "max-h-[120px] min-h-[44px]"
                      )}
                      disabled={isGenerating}
                      rows={1}
                      style={{ height: "auto" }}
                      onInput={autoResizeTextarea}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={!prompt.trim() || isGenerating}
                    loading={isGenerating}
                    size="icon"
                    className="h-11 w-11 flex-shrink-0 rounded-full"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                </form>

                {/* Suggested prompts */}
                {chatHistory.length === 0 && (
                  <div className="mt-6 space-y-2">
                    <h3 className="text-center text-sm font-medium">
                      Suggested prompts:
                    </h3>
                    <div className="flex flex-col gap-1">
                      {[
                        "Summarize the content of this page and create an overview section at the top.",
                        "Add a new section about <topic> to the page.",
                        "Add a conclusion section to the bottom of the page.",
                      ].map((suggestion) => (
                        <Button
                          key={suggestion}
                          variant="ghost"
                          onClick={() => handleSetPrompt(suggestion)}
                          disabled={isGenerating}
                          className={cn(
                            "h-fit w-full text-wrap text-xs",
                            "transition-colors hover:bg-gray-400/50",
                            "disabled:cursor-not-allowed disabled:opacity-50"
                          )}
                        >
                          <span className="text-wrap text-xs">
                            {suggestion}
                          </span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
