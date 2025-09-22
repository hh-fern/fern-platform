import type { ComponentProps, JSX } from "react";

import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { Circle } from "lucide-react";

import { cn } from "@fern-docs/components";

const RadioGroup = ({
  className,
  ref,
  ...props
}: ComponentProps<typeof RadioGroupPrimitive.Root>): JSX.Element => {
  return (
    <RadioGroupPrimitive.Root
      className={cn("grid gap-2", className)}
      {...props}
      ref={ref}
    />
  );
};

const RadioGroupItem = ({
  className,
  ref,
  ...props
}: ComponentProps<typeof RadioGroupPrimitive.Item>): JSX.Element => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "border-(color:--accent-6) text-(color:--accent-6) focus-visible:ring-(color:--accent) aspect-square h-4 w-4 rounded-full border shadow focus:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle className="fill-(color:--accent-6) size-3.5" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
};

export { RadioGroup, RadioGroupItem };
