import React from "react";

import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@fern-docs/components";

const Tabs: React.FC<TabsPrimitive.TabsProps> = TabsPrimitive.Root;

const TabsList = ({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>): React.JSX.Element => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "bg-(color:--grayscale-a3) text-(color:--accent-12) rounded-2 inline-flex h-9 items-center justify-center p-1",
      className
    )}
    {...props}
  />
);

const TabsTrigger = ({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>): React.JSX.Element => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "ring-offset-background focus-visible:ring-(color:--accent) data-[state=active]:bg-(color:--grayscale-1) data-[state=active]:text-(color:--grayscale-12) rounded-3/2 inline-flex items-center justify-center whitespace-nowrap px-3 py-1 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow",
      className
    )}
    {...props}
  />
);

const TabsContent = ({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>): React.JSX.Element => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "ring-offset-background focus-visible:ring-(color:--accent) mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
);

export { Tabs, TabsContent, TabsList, TabsTrigger };
