import type { ComponentProps, FC, JSX } from "react";

import * as PopoverPrimitive from "@radix-ui/react-popover";

import { cn } from "@fern-docs/components";

const Popover: FC<PopoverPrimitive.PopoverProps> = PopoverPrimitive.Root;

const PopoverTrigger: FC<PopoverPrimitive.PopoverTriggerProps> =
  PopoverPrimitive.Trigger;

const PopoverAnchor: FC<PopoverPrimitive.PopoverAnchorProps> =
  PopoverPrimitive.Anchor;

const PopoverContent = ({
  className,
  align = "center",
  sideOffset = 4,
  ref,
  ...props
}: ComponentProps<typeof PopoverPrimitive.Content>): JSX.Element => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 border-border-default bg-(color:--grayscale-1) text-(color:--accent-12) rounded-3/2 z-50 w-72 border p-4 shadow-md outline-none",
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
);

export { Popover, PopoverAnchor, PopoverContent, PopoverTrigger };
