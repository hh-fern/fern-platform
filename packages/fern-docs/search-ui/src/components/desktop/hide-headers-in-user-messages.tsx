import type { ComponentProps, ReactNode } from "react";

import type { Element as HastElement } from "hast";

type PropsWithElement<T> = T & { node: HastElement };

type Headers = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

export function HideHeadersInUserMessage(): {
  [key in Headers]: (props: PropsWithElement<ComponentProps<key>>) => ReactNode;
} {
  return {
    h1: ({ children }: PropsWithElement<ComponentProps<"h1">>) => children,
    h2: ({ children }: PropsWithElement<ComponentProps<"h2">>) => children,
    h3: ({ children }: PropsWithElement<ComponentProps<"h3">>) => children,
    h4: ({ children }: PropsWithElement<ComponentProps<"h4">>) => children,
    h5: ({ children }: PropsWithElement<ComponentProps<"h5">>) => children,
    h6: ({ children }: PropsWithElement<ComponentProps<"h6">>) => children,
  };
}
