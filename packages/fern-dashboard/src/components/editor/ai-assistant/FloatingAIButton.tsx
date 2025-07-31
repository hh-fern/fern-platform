"use client";

import React from "react";

import { ChevronLeft, ChevronRight, PencilIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/utils/utils";

export declare namespace FloatingAIButton {
  export interface Props {
    onClick: () => void;
    isOpen?: boolean;
    className?: string;
  }
}

export function FloatingAIButton({
  onClick,
  isOpen = false,
  className,
}: FloatingAIButton.Props) {
  return (
    <div
      className="fixed z-50 transition-all duration-300 ease-in-out"
      style={{
        top: isOpen
          ? "calc(var(--header-toolbar-height) + 18px)"
          : "calc(var(--header-height) + var(--header-toolbar-height) + 1.5rem)",
        right: isOpen ? "calc(384px - 3rem)" : "1.5rem", // Position in top-left of panel when open
      }}
    >
      <Button
        onClick={onClick}
        size="icon"
        className={cn(
          "bg-primary hover:bg-primary/90 shadow-background-a9 group relative z-50 h-12 overflow-hidden rounded-full shadow-md transition-all duration-300",
          isOpen ? "w-12 px-0" : "w-fit px-4",
          className
        )}
        aria-label={isOpen ? "Close AI Assistant" : "Open AI Assistant"}
      >
        <div className="flex items-center gap-2 transition-all duration-300">
          {isOpen ? (
            <ChevronLeft className="h-6 w-6" />
          ) : (
            <>
              <PencilIcon className="h-6 w-6" />
              <span className="whitespace-nowrap">Help me write</span>
              <ChevronRight className="h-6 w-6" />
            </>
          )}
        </div>
      </Button>
    </div>
  );
}
