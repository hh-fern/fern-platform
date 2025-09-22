import type { ComponentProps } from "react";

import * as LabelPrimitive from "@radix-ui/react-label";
import { type VariantProps, cva } from "class-variance-authority";
import type { ClassProp } from "class-variance-authority/types";

import { cn } from "@fern-docs/components";

const labelVariants: (props?: ClassProp | undefined) => string = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);

export function Label({
  className,
  ref,
  ...props
}: ComponentProps<typeof LabelPrimitive.Root> &
  VariantProps<typeof labelVariants>): JSX.Element {
  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(labelVariants(), className)}
      {...props}
    />
  );
}
