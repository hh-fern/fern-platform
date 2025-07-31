"use client";

import React from "react";

import { ChevronRight, PencilIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/utils/utils";

export declare namespace FloatingAIButton {
  export interface Props {
    onClick: () => void;
    className?: string;
  }
}

export function FloatingAIButton({
  onClick,
  className,
}: FloatingAIButton.Props) {
  return (
    <div className="fixed right-6 top-[142px] z-50">
      <Button
        onClick={onClick}
        size="icon"
        className={cn(
          "bg-primary hover:bg-primary/90 shadow-background-a9 group relative z-50 h-12 w-fit overflow-hidden rounded-full px-4 shadow-md transition-all duration-200",
          className
        )}
        aria-label="Open AI Assistant"
      >
        <div className="after:animate-shine flex items-center gap-2 after:absolute after:inset-y-0 after:w-8 after:bg-white/50 after:blur after:content-['']">
          <PencilIcon className="h-6 w-6" />
          Help me write
          <ChevronRight className="h-10 w-10" />
        </div>
      </Button>
    </div>
  );
}
