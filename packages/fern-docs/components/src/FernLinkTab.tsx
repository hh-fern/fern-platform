"use client";

import { FernLink } from "./FernLink";
import { useDispatchSidebarAction } from "./utils/navigation";

export function FernLinkTab({
  children,
  ...props
}: React.ComponentProps<typeof FernLink>) {
  const dispatch = useDispatchSidebarAction();
  return (
    <FernLink
      {...props}
      onClick={() => {
        dispatch({ type: "collapse-all" });
      }}
    >
      {children}
    </FernLink>
  );
}
