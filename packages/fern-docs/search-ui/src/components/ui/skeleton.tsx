import type { ComponentProps, JSX } from "react";

import { cn } from "@fern-docs/components";

function Skeleton({ className, ...props }: ComponentProps<"div">): JSX.Element {
  return (
    <div
      className={cn(
        "bg-(color:--grayscale-a3) rounded-3/2 animate-pulse",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
