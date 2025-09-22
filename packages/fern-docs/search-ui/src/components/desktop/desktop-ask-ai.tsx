"use client";

import type { ComponentProps, ReactNode } from "react";
import { useRef } from "react";

import { composeEventHandlers } from "@radix-ui/primitive";
import { composeRefs } from "@radix-ui/react-compose-refs";

import type { SqueezedMessage } from "../chatbot/utils";
import { useFacetFilters } from "../search/useFacetFilters";
import { CommandAskAIGroup } from "../shared";
import { DesktopCommandContent } from "./desktop-command";
import { DesktopCommandRoot } from "./desktop-command-root";

export function DesktopCommandWithAskAI({
  children,
  body,
  headers,
  initialInput,
  setInitialInput,
  onSelectHit,
  prefetch,
  composerActions,
  domain,
  renderActions,
  asChild,
  darkCodeEnabled,
  useConversationId,
  openSearchPanel,
  ref,
  ...props
}: Omit<ComponentProps<typeof DesktopCommandRoot>, "children"> & {
  body?: object;
  headers?: Record<string, string>;
  initialInput?: string;
  setInitialInput?: (initialInput: string) => void;
  onSelectHit?: (path: string) => void;
  prefetch?: (path: string) => Promise<void>;
  composerActions?: ReactNode;
  domain: string;
  renderActions?: (message: SqueezedMessage, queryId?: string) => ReactNode;
  children?: ReactNode;
  darkCodeEnabled?: boolean;
  useConversationId: () => {
    conversationId: string;
    setConversationId: (conversationId: string) => void;
    resetConversationId: () => void;
  };
  openSearchPanel?: () => void;
}): JSX.Element {
  const internalRef = useRef<HTMLDivElement>(null);
  const { filters, handlePopState: handlePopFilters } = useFacetFilters();

  return (
    <DesktopCommandRoot
      label={"Search"}
      {...props}
      ref={composeRefs(ref, internalRef)}
      shouldFilter={true}
      disableAutoSelection={false}
      onPopState={composeEventHandlers(props.onPopState, handlePopFilters, {
        checkForDefaultPrevented: false,
      })}
      onEscapeKeyDown={props.onEscapeKeyDown}
      escapeKeyShouldPopState={filters.length > 0}
      data-fern-search="desktop-command"
      data-mode={"search"}
    >
      <DesktopCommandContent asChild={asChild}>
        <CommandAskAIGroup
          onAskAI={(initialInput) => {
            setInitialInput?.(initialInput);
            openSearchPanel?.();
            props.onEscapeKeyDown?.({} as any);
          }}
          forceMount
        />
        {children}
      </DesktopCommandContent>
    </DesktopCommandRoot>
  );
}
