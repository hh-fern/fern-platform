import React from "react";

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight, Circle } from "lucide-react";

import { Kbd } from "@fern-docs/components";
import { cn } from "@fern-docs/components";

const DropdownMenu: React.FC<DropdownMenuPrimitive.DropdownMenuProps> =
  DropdownMenuPrimitive.Root;

const DropdownMenuTrigger: React.FC<DropdownMenuPrimitive.DropdownMenuTriggerProps> =
  DropdownMenuPrimitive.Trigger;

const DropdownMenuGroup: React.FC<DropdownMenuPrimitive.DropdownMenuGroupProps> =
  DropdownMenuPrimitive.Group;

const DropdownMenuPortal: React.FC<DropdownMenuPrimitive.DropdownMenuPortalProps> =
  DropdownMenuPrimitive.Portal;

const DropdownMenuSub: React.FC<DropdownMenuPrimitive.DropdownMenuSubProps> =
  DropdownMenuPrimitive.Sub;

const DropdownMenuRadioGroup: React.FC<DropdownMenuPrimitive.DropdownMenuRadioGroupProps> =
  DropdownMenuPrimitive.RadioGroup;

const DropdownMenuSubTrigger = ({
  className,
  inset,
  children,
  ref,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean;
}): React.JSX.Element => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "focus:bg-(color:--accent-a3) data-[state=open]:bg-(color:--accent-a3) rounded-1 flex cursor-default select-none items-center gap-2 px-2 py-1.5 text-sm outline-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto" />
  </DropdownMenuPrimitive.SubTrigger>
);

const DropdownMenuSubContent = ({
  className,
  ref,
  ...props
}: React.ComponentProps<
  typeof DropdownMenuPrimitive.SubContent
>): React.JSX.Element => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 border-border-default bg-(color:--grayscale-a1) text-(color:--grayscale-a12) rounded-3/2 z-50 min-w-[8rem] overflow-hidden border p-1 shadow-lg",
      className
    )}
    {...props}
  />
);

const DropdownMenuContent = ({
  className,
  sideOffset = 4,
  ref,
  ...props
}: React.ComponentProps<
  typeof DropdownMenuPrimitive.Content
>): React.JSX.Element => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "border-border-default bg-(color:--grayscale-surface) text-(color:--grayscale-a11) rounded-3/2 z-50 min-w-[8rem] overflow-hidden border p-1 shadow-md backdrop-blur-xl",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        "before:bg-background-a9 before:pointer-events-none before:absolute before:inset-0 before:-z-50",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
);

const DropdownMenuItem = ({
  className,
  inset,
  ref,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean;
}): React.JSX.Element => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "focus:bg-(color:--accent-a3) focus:text-(color:--accent-a11) rounded-1 relative flex cursor-default select-none items-center gap-2 px-2 py-1.5 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0",
      inset && "pl-8",
      className
    )}
    {...props}
  />
);

const DropdownMenuCheckboxItem = ({
  className,
  children,
  checked,
  ref,
  ...props
}: React.ComponentProps<
  typeof DropdownMenuPrimitive.CheckboxItem
>): React.JSX.Element => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "focus:bg-(color:--accent-a3) focus:text-(color:--accent-a11) rounded-1 relative flex cursor-default select-none items-center py-1.5 pl-8 pr-2 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex size-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="size-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
);

const DropdownMenuRadioItem = ({
  className,
  children,
  ref,
  ...props
}: React.ComponentProps<
  typeof DropdownMenuPrimitive.RadioItem
>): React.JSX.Element => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "focus:bg-(color:--accent-a3) focus:text-(color:--accent-a11) rounded-1 relative flex cursor-default select-none items-center py-1.5 pl-8 pr-2 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex size-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="size-1.5 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
);

const DropdownMenuLabel = ({
  className,
  inset,
  ref,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean;
}): React.JSX.Element => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    )}
    {...props}
  />
);

const DropdownMenuSeparator = ({
  className,
  ref,
  ...props
}: React.ComponentProps<
  typeof DropdownMenuPrimitive.Separator
>): React.JSX.Element => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("bg-border-concealed -mx-1 my-1 h-px", className)}
    {...props}
  />
);

const DropdownMenuShortcut = ({
  className,
  ref,
  ...props
}: React.ComponentProps<"span">): React.JSX.Element => {
  return <Kbd ref={ref} className={cn("ml-auto", className)} {...props} />;
};

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
};
