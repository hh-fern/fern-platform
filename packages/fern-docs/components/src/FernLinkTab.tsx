"use client";

import { FernLink } from "./FernLink";
import { track } from "./analytics/track";
import { useDispatchSidebarAction } from "./state/navigation";

export function FernLinkTab({
  children,
  ...props
}: React.ComponentProps<typeof FernLink>) {
  const dispatch = useDispatchSidebarAction();
  return (
    <FernLink
      {...props}
      onClick={() => {
        track("tab_clicked", {
          href: props.href,
        });
        dispatch({ type: "collapse-all" });
      }}
    >
      {children}
    </FernLink>
  );
}
