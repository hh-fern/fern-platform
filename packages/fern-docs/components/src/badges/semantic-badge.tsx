import { forwardRef } from "react";

import {
  SemanticColor,
  SemanticColorMap,
} from "@fern-api/docs-utils/src/colors";

import { Badge, BadgeProps } from "./badge";

export interface SemanticBadgeProps extends Omit<BadgeProps, "color"> {
  intent?: SemanticColor;
}

export const SemanticBadge = forwardRef<
  HTMLSpanElement & HTMLButtonElement,
  SemanticBadgeProps
>(({ intent, ...props }, ref) => {
  return (
    <Badge
      {...props}
      ref={ref}
      color={intent ? SemanticColorMap[intent] : undefined}
      data-intent={intent}
    />
  );
});

SemanticBadge.displayName = "SemanticBadge";
