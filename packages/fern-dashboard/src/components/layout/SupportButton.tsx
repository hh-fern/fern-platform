"use client";

import type * as React from "react";

import { getPylon } from "../pylon/getPylon";
import { Button } from "../ui/button";

export declare namespace SupportButton {
  export interface Props {
    className?: string;
    buttonProps?: React.ComponentProps<typeof Button>;
    icon?: React.ReactNode;
  }
}

export function SupportButton({
  className,
  buttonProps,
  icon,
}: SupportButton.Props) {
  return (
    <Button
      onClick={() => {
        getPylon()?.("show");
        getPylon()?.("showChatBubble");
      }}
      className={className}
      variant="ghost"
      {...buttonProps}
      size="sm"
    >
      {icon}
      Support
    </Button>
  );
}
