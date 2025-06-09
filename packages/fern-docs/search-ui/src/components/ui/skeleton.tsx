import React from "react";

import { cn } from "@fern-api/docs-utils/cn";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
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
