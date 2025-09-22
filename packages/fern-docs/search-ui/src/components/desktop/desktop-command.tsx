import {
  type ComponentProps,
  type KeyboardEvent,
  type PropsWithChildren,
  type ReactNode,
  memo,
  useEffect,
  useRef,
} from "react";

import { composeEventHandlers } from "@radix-ui/primitive";
import { composeRefs } from "@radix-ui/react-compose-refs";
import { TooltipPortal } from "@radix-ui/react-tooltip";
import { ArrowLeft } from "lucide-react";

import { Button } from "@fern-docs/components/button";
import { Kbd } from "@fern-docs/components/kbd";
import { tunnel, usePlatformKbdShortcut } from "@fern-ui/react-commons";

import * as Command from "../cmdk";
import { useFacetFilters } from "../search/useFacetFilters";
import { useSearchBox } from "../search/useSearchBox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { DesktopCommandBadges } from "./desktop-command-badges";
import {
  DesktopCommandInput,
  DesktopCommandInputError,
} from "./desktop-command-input";
import { DesktopCommandRoot } from "./desktop-command-root";

export interface DesktopCommandProps {
  onEscapeKeyDown?: (e: KeyboardEvent<HTMLDivElement>) => void;
  onPopState?: (e: KeyboardEvent<HTMLDivElement>) => void;
  placeholder?: string;
}

export const beforeInput: {
  In: (props: PropsWithChildren) => null;
  Out: () => ReactNode;
  useHasChildren: () => boolean;
} = tunnel();
export const afterInput: {
  In: (props: PropsWithChildren) => null;
  Out: () => ReactNode;
  useHasChildren: () => boolean;
} = tunnel();

/**
 * The desktop command is intended to be used within a dialog component.
 */
const DesktopCommand = ({
  onPopState,
  children,
  placeholder,
  asChild,
  ref: forwardedRef,
  ...props
}: DesktopCommandProps &
  ComponentProps<typeof DesktopCommandRoot>): JSX.Element => {
  const { filters, handlePopState: handlePopFilters } = useFacetFilters();
  const ref = useRef<HTMLDivElement>(null);

  // animate on presence
  useEffect(() => {
    if (ref.current) {
      ref.current.animate(
        { transform: ["scale(0.96)", "scale(1)"] },
        { duration: 100, easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)" }
      );
    }
  }, []);

  return (
    <DesktopCommandRoot
      label="Search"
      {...props}
      ref={composeRefs(forwardedRef, ref)}
      onPopState={composeEventHandlers(onPopState, handlePopFilters, {
        checkForDefaultPrevented: false,
      })}
      escapeKeyShouldPopState={filters.length > 0}
      data-fern-search="desktop-command"
      data-mode={"search"}
    >
      <DesktopCommandContent asChild={asChild}>
        {children}
      </DesktopCommandContent>
    </DesktopCommandRoot>
  );
};

export const DesktopCommandContent: React.FC<{
  children: ReactNode;
  asChild?: boolean;
}> = memo(
  ({
    children,
    asChild,
  }: {
    children: ReactNode;
    asChild?: boolean;
  }): JSX.Element => {
    const inputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    return (
      <>
        <div
          className="cursor-text"
          onClick={() => {
            inputRef.current?.focus();
          }}
        >
          <DesktopCommandBadges />

          <div data-cmdk-fern-header="">
            <beforeInput.Out />

            <DesktopCommandInputError asChild>
              <DesktopCommandInputSearch ref={inputRef} />
            </DesktopCommandInputError>

            <afterInput.Out />
          </div>
        </div>

        <Command.List ref={scrollRef} tabIndex={-1} asChild={asChild}>
          {children}
        </Command.List>
      </>
    );
  }
);

DesktopCommandContent.displayName = "DesktopCommandContent";

const DesktopCommandInputSearch = memo(
  ({
    ref: forwardedRef,
    ...props
  }: ComponentProps<typeof DesktopCommandInput>): JSX.Element => {
    const inputRef = useRef<HTMLInputElement>(null);
    const { query, refine } = useSearchBox();
    useEffect(() => {
      setTimeout(() => {
        if (document.activeElement !== inputRef.current) {
          inputRef.current?.focus();
        }
      });
    });
    return (
      <DesktopCommandInput
        inputMode="search"
        autoFocus
        value={query}
        maxLength={100}
        placeholder="Search"
        {...props}
        ref={composeRefs(inputRef, forwardedRef)}
        onValueChange={(value) => {
          refine(value);
          props.onValueChange?.(value);
        }}
      />
    );
  }
);

DesktopCommandInputSearch.displayName = "DesktopCommandInputSearch";

function DesktopBackButton({
  pop,
  clear,
  showAdditionalCommand,
}: {
  pop: () => void;
  clear: () => void;
  /**
   * if false, the text says `Del` to go back
   * if true, the text says `Del` to go back or `Ctrl` `Del` to go to root search
   */
  showAdditionalCommand?: boolean;
}): React.ReactNode {
  const shortcut = usePlatformKbdShortcut();

  const additionalCommand = showAdditionalCommand && shortcut && (
    <>
      <span> or </span>
      <Kbd className="mx-1">{shortcut}</Kbd>
      <Kbd className="me-1">Del</Kbd>
      <span> to go to root search</span>
    </>
  );

  return (
    <beforeInput.In>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="iconSm"
              variant="outline"
              className="shrink-0"
              onClickCapture={(e) => {
                if (e.metaKey || e.ctrlKey) {
                  clear();
                } else {
                  pop();
                }
              }}
              onKeyDownCapture={(e) => {
                if (
                  e.key === "Backspace" ||
                  e.key === "Delete" ||
                  e.key === "Space" ||
                  (e.key === "Enter" && !e.nativeEvent.isComposing)
                ) {
                  if (e.metaKey || e.ctrlKey) {
                    clear();
                  } else {
                    pop();
                  }
                  e.stopPropagation();
                }
              }}
            >
              <ArrowLeft />
            </Button>
          </TooltipTrigger>
          <TooltipPortal>
            <TooltipContent className="shrink-0">
              <p>
                <Kbd className="me-1">Del</Kbd>
                <span> to go back</span>
                {additionalCommand}
              </p>
            </TooltipContent>
          </TooltipPortal>
        </Tooltip>
      </TooltipProvider>
    </beforeInput.In>
  );
}

const DefaultDesktopBackButton = (): ReactNode => {
  const { filters, popFilter, clearFilters } = useFacetFilters();

  if (filters.length === 0) {
    return false;
  }

  return <DesktopBackButton pop={popFilter} clear={clearFilters} />;
};

const DesktopCommandAfterInput: (props: PropsWithChildren) => null =
  afterInput.In;

export {
  DefaultDesktopBackButton,
  DesktopBackButton,
  DesktopCommand,
  DesktopCommandAfterInput,
};
