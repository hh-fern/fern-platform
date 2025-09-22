import type { ComponentProps, FC, JSX } from "react";

import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "@fern-docs/components";

const Select: FC<SelectPrimitive.SelectProps> = SelectPrimitive.Root;

const SelectGroup: FC<SelectPrimitive.SelectGroupProps> = SelectPrimitive.Group;

const SelectValue: FC<SelectPrimitive.SelectValueProps> = SelectPrimitive.Value;

function SelectTrigger({
  className,
  children,
  ref,
  ...props
}: ComponentProps<typeof SelectPrimitive.Trigger>): JSX.Element {
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        "ring-offset-background border-border-default placeholder:text-(color:--accent-12) focus:ring-(color:--accent-6) rounded-2 shadow-card-grayscale flex h-9 w-full items-center justify-between whitespace-nowrap border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
        "[&>span]:inline-flex [&>span]:items-center [&>span]:gap-2 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="ml-2 size-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectScrollUpButton({
  className,
  ref,
  ...props
}: ComponentProps<typeof SelectPrimitive.ScrollUpButton>): JSX.Element {
  return (
    <SelectPrimitive.ScrollUpButton
      ref={ref}
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className
      )}
      {...props}
    >
      <ChevronUp className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  );
}

function SelectScrollDownButton({
  className,
  ref,
  ...props
}: ComponentProps<typeof SelectPrimitive.ScrollDownButton>): JSX.Element {
  return (
    <SelectPrimitive.ScrollDownButton
      ref={ref}
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className
      )}
      {...props}
    >
      <ChevronDown className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  );
}

function SelectContent({
  className,
  children,
  position = "popper",
  ref,
  ...props
}: ComponentProps<typeof SelectPrimitive.Content>): JSX.Element {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={cn(
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 bg-(color:--grayscale-1) text-(color:--accent-12) rounded-2 relative z-50 max-h-96 min-w-[8rem] overflow-hidden border shadow-md",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "p-1",
            position === "popper" &&
              "h-(--radix-select-trigger-height) min-w-(--radix-select-trigger-width) w-full"
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({
  className,
  ref,
  ...props
}: ComponentProps<typeof SelectPrimitive.Label>): JSX.Element {
  return (
    <SelectPrimitive.Label
      ref={ref}
      className={cn("px-2 py-1.5 text-sm font-semibold", className)}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  ref,
  ...props
}: ComponentProps<typeof SelectPrimitive.Item>): JSX.Element {
  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        "focus:bg-(color:--accent-a3) focus:text-(color:--accent-12) rounded-1 relative flex w-full cursor-default select-none items-center py-1.5 pl-2 pr-8 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        "[&>span]:inline-flex [&>span]:items-center [&>span]:gap-2 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
        className
      )}
      {...props}
    >
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({
  className,
  ref,
  ...props
}: ComponentProps<typeof SelectPrimitive.Separator>): JSX.Element {
  return (
    <SelectPrimitive.Separator
      ref={ref}
      className={cn("bg-border-concealed -mx-1 my-1 h-px", className)}
      {...props}
    />
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
