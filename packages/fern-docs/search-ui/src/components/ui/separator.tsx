import type { ComponentProps, JSX } from "react";

import * as SeparatorPrimitive from "@radix-ui/react-separator";

import { cn } from "@fern-docs/components";

const Separator = ({
  className,
  orientation = "horizontal",
  decorative = true,
  ref,
  ...props
}: ComponentProps<typeof SeparatorPrimitive.Root>): JSX.Element => (
  <SeparatorPrimitive.Root
    ref={ref}
    decorative={decorative}
    orientation={orientation}
    className={cn(
      "bg-border-default shrink-0",
      orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
      className
    )}
    {...props}
  />
);

export { Separator };
