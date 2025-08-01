"use client";

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";

import { AIAssistant } from "@/components/editor/ai-assistant";

interface AIAssistantContextType {
  setupAI: (options: {
    currentHtml: string;
    pageContext: string;
    onContentGenerated: (response: {
      content: string;
      placement: string;
    }) => void;
    getCurrentContent: () => string;
  }) => void;
}

const AIAssistantContext = createContext<AIAssistantContextType | null>(null);

export function useAIAssistant() {
  const context = useContext(AIAssistantContext);
  if (!context) {
    throw new Error("useAIAssistant must be used within AIAssistantProvider");
  }
  return context;
}

interface AIAssistantProviderProps {
  children: ReactNode;
}

interface AIAssistantState {
  currentHtml: string;
  pageContext: string;
  onContentGenerated: (response: {
    content: string;
    placement: string;
  }) => void;
  getCurrentContent: () => string;
}

export function AIAssistantProvider({ children }: AIAssistantProviderProps) {
  const [assistantOptions, setAssistantOptions] =
    useState<AIAssistantState | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const setupAI = useCallback(
    (options: {
      currentHtml: string;
      pageContext: string;
      onContentGenerated: (response: {
        content: string;
        placement: string;
      }) => void;
      getCurrentContent: () => string;
    }) => {
      setAssistantOptions(options);
    },
    []
  );

  const toggleAI = useCallback(() => {
    if (assistantOptions) {
      setIsOpen(!isOpen);
    }
  }, [isOpen, assistantOptions]);

  return (
    <AIAssistantContext.Provider value={{ setupAI }}>
      {children}

      {assistantOptions && (
        <AIAssistant
          currentHtml={assistantOptions.currentHtml}
          pageContext={assistantOptions.pageContext}
          onContentGenerated={assistantOptions.onContentGenerated}
          getCurrentContent={assistantOptions.getCurrentContent}
          isOpen={isOpen}
          onToggle={toggleAI}
        />
      )}
    </AIAssistantContext.Provider>
  );
}
