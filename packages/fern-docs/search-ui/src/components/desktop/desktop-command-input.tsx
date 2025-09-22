import type { ComponentProps, RefObject } from "react";
import { useEffect, useRef } from "react";

import { composeEventHandlers } from "@radix-ui/primitive";
import { composeRefs } from "@radix-ui/react-compose-refs";
import { Slot } from "@radix-ui/react-slot";
import { TooltipPortal } from "@radix-ui/react-tooltip";
import { useIsomorphicLayoutEffect } from "swr/_internal";

import * as Command from "../cmdk";
import { useCommandUx } from "../shared";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

export const DesktopCommandInputError = ({
  children,
  asChild,
  ref,
  ...props
}: ComponentProps<typeof TooltipTrigger> & {
  ref?: RefObject<HTMLButtonElement>;
}): JSX.Element => {
  const { inputError } = useCommandUx();
  if (inputError == null) {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp {...props} ref={ref}>
        {children}
      </Comp>
    );
  }
  return (
    <TooltipProvider>
      <Tooltip open={true}>
        <TooltipTrigger {...props} ref={ref} asChild={asChild}>
          {children}
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipContent side="bottom" align="start">
            <p>{inputError}</p>
          </TooltipContent>
        </TooltipPortal>
      </Tooltip>
    </TooltipProvider>
  );
};

export const DesktopCommandInput = ({
  children,
  ref: forwardedRef,
  ...props
}: ComponentProps<typeof Command.Input>): JSX.Element => {
  const scrollSelectedIntoView = Command.useScrollSelectedIntoView();
  const inputRef = useRef<HTMLInputElement>(null);
  const selectionStateStart = useRef<number | null>(null);
  const selectionStateEnd = useRef<number | null>(null);
  const { setInputRef } = useCommandUx();

  // there's a bug in the cmdk library where the input gets re-mounted when the user types, and the cursor position is lost
  // so when you're typing in the middle of the input, the cursor gets reset to the end of the input.
  // this is a workaround to save the cursor position when the user types, and then restore it when the input is mounted again
  useIsomorphicLayoutEffect(() => {
    setInputRef(inputRef.current);
    inputRef.current?.setSelectionRange(
      selectionStateStart.current,
      selectionStateEnd.current
    );
  });

  // receive a custom event that clears the input when the user presses escape
  useEffect(() => {
    const element = inputRef.current;
    if (!element || props.disabled) {
      return;
    }
    const onClearInput = () => {
      props.onValueChange?.("");
    };
    element.addEventListener("cmdk-fern-clear-input", onClearInput);
    return () =>
      element.removeEventListener("cmdk-fern-clear-input", onClearInput);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.onValueChange, props.disabled]);

  return (
    <Command.Input
      {...props}
      ref={composeRefs(inputRef, forwardedRef)}
      onChangeCapture={composeEventHandlers(props.onChangeCapture, (e) => {
        selectionStateStart.current = e.currentTarget.selectionStart;
        selectionStateEnd.current = e.currentTarget.selectionEnd;
        scrollSelectedIntoView();
      })}
      onBlur={composeEventHandlers(props.onBlur, () => {
        selectionStateStart.current = null;
        selectionStateEnd.current = null;
      })}
      onFocus={composeEventHandlers(props.onFocus, () => {
        selectionStateStart.current = null;
        selectionStateEnd.current = null;
      })}
    >
      {children}
    </Command.Input>
  );
};
