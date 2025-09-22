import { type FC, memo } from "react";

import { Kbd } from "@fern-docs/components";
import { cn } from "@fern-docs/components";

export const CommandKbd: FC<{ className?: string }> = memo(
  ({ className }: { className?: string }): React.ReactNode => {
    return (
      <span className={cn("inline-flex items-center gap-1", className)}>
        <Kbd>{"⌘"}</Kbd>
      </span>
    );
  }
);
CommandKbd.displayName = "CommandKbd";

export const ForwardSlashKbd: FC<{ className?: string }> = memo(
  ({ className }: { className?: string }): React.ReactNode => {
    return (
      <span className={cn("inline-flex items-center gap-1", className)}>
        <Kbd>{"/"}</Kbd>
      </span>
    );
  }
);
ForwardSlashKbd.displayName = "ForwardSlashKbd";
