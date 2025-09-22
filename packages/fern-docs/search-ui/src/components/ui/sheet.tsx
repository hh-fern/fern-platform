import React from "react";

import * as SheetPrimitive from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { type VariantProps, cva } from "class-variance-authority";
import type { ClassProp } from "class-variance-authority/types";
import { X } from "lucide-react";

import { cn } from "@fern-docs/components";

const Sheet: React.FC<SheetPrimitive.DialogProps> = SheetPrimitive.Root;

const SheetTrigger: React.FC<SheetPrimitive.DialogTriggerProps> =
  SheetPrimitive.Trigger;

const SheetClose: React.FC<SheetPrimitive.DialogCloseProps> =
  SheetPrimitive.Close;

const SheetPortal: React.FC<SheetPrimitive.DialogPortalProps> =
  SheetPrimitive.Portal;

const SheetOverlay = ({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>): React.JSX.Element => (
  <SheetPrimitive.Overlay
    className={cn(
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80",
      className
    )}
    {...props}
    ref={ref}
  />
);

const sheetVariants: (
  props?:
    | ({
        side?: "top" | "bottom" | "left" | "right" | null | undefined;
      } & ClassProp)
    | undefined
) => string = cva(
  "data-[state=open]:animate-in data-[state=closed]:animate-out bg-(color:--grayscale-1) fixed z-50 gap-4 p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
  {
    variants: {
      side: {
        top: "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 border-b",
        bottom:
          "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 border-t",
        left: "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
        right:
          "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
);

interface SheetContentProps
  extends React.ComponentProps<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

const SheetContent = ({
  side = "right",
  className,
  children,
  ref,
  ...props
}: SheetContentProps): React.JSX.Element => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(sheetVariants({ side }), className)}
      {...props}
    >
      <SheetPrimitive.Close className="ring-offset-background focus:ring-(color:--accent-6) data-[state=open]:bg-(color:--grayscale-a3) rounded-1 absolute right-4 top-4 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none">
        <X className="size-4" />
        <VisuallyHidden>Close</VisuallyHidden>
      </SheetPrimitive.Close>
      {children}
    </SheetPrimitive.Content>
  </SheetPortal>
);

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
);

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
);

const SheetTitle = ({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>): React.JSX.Element => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn(
      "text-(color:--grayscale-12) text-lg font-semibold",
      className
    )}
    {...props}
  />
);

const SheetDescription = ({
  className,
  ref,
  ...props
}: React.ComponentProps<
  typeof SheetPrimitive.Description
>): React.JSX.Element => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-(color:--accent-12) text-sm", className)}
    {...props}
  />
);

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
};
