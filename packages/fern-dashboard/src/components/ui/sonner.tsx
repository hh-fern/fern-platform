"use client";

import { useTheme } from "next-themes";

import type { ToasterProps } from "sonner";
import { Toaster as Sonner } from "sonner";

const Toaster = ({ ...props }: ToasterProps): JSX.Element => {
  const { resolvedTheme = "light" } = useTheme();

  return (
    <Sonner
      theme={resolvedTheme as ToasterProps["theme"]}
      className="toaster group !font-sans"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
