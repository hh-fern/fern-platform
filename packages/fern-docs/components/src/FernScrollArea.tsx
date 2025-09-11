"use client";

import { PropsWithChildren, RefObject, forwardRef, useEffect } from "react";

import * as ScrollArea from "@radix-ui/react-scroll-area";

import { cn } from "./cn";

export declare namespace FernScrollArea {
  interface InitialScrollPosition {
    top?: number;
    left?: number;
  }

  interface FernScrollAreaProps
    extends ScrollArea.ScrollAreaProps,
      Omit<ScrollArea.ScrollAreaViewportProps, "dir"> {
    className?: string;
    rootClassName?: string;
    rootRef?: RefObject<HTMLDivElement>;
    scrollbars?: "both" | "vertical" | "horizontal";
    initialScrollPosition?: InitialScrollPosition;
  }

  export type Props = PropsWithChildren<FernScrollAreaProps>;
}

export const FernScrollArea = forwardRef<HTMLDivElement, FernScrollArea.Props>(
  (props, ref) => {
    const {
      children,
      className,
      rootClassName,
      rootRef,
      scrollbars = "both",
      type,
      dir,
      scrollHideDelay = type !== "scroll" ? 0 : undefined,
      initialScrollPosition,
      ...viewportProps
    } = props;

    // Handle initial scroll position
    useEffect(() => {
      if (
        !initialScrollPosition ||
        !ref ||
        typeof ref !== "object" ||
        !ref.current
      ) {
        return;
      }

      console.log(
        "FernScrollArea: Attempting to scroll to:",
        initialScrollPosition
      );

      const timeoutId = setTimeout(() => {
        if (ref && typeof ref === "object" && ref.current) {
          const scrollOptions: ScrollToOptions = {
            top: initialScrollPosition.top ?? 0,
            left: initialScrollPosition.left ?? 0,
            behavior: "smooth",
          };

          console.log("FernScrollArea: Scrolling with options:", scrollOptions);
          ref.current.scrollTo(scrollOptions);
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }, [initialScrollPosition, ref]);

    return (
      <ScrollArea.Root
        className={cn("fern-scroll-area", rootClassName)}
        ref={rootRef}
        type={type}
        dir={dir}
        scrollHideDelay={scrollHideDelay}
      >
        <ScrollArea.Viewport
          ref={ref}
          className={cn("fern-scroll-area-viewport", className)}
          data-scrollbars={scrollbars}
          {...viewportProps}
        >
          {children}
        </ScrollArea.Viewport>
        {scrollbars !== "horizontal" && (
          <ScrollArea.Scrollbar
            orientation="vertical"
            className="fern-scroll-area-scrollbar"
            forceMount
          >
            <ScrollArea.Thumb className="fern-scroll-area-thumb" />
          </ScrollArea.Scrollbar>
        )}
        {scrollbars !== "vertical" && (
          <ScrollArea.Scrollbar
            orientation="horizontal"
            className="fern-scroll-area-scrollbar"
            forceMount
          >
            <ScrollArea.Thumb className="fern-scroll-area-thumb" />
          </ScrollArea.Scrollbar>
        )}
        {props.scrollbars !== "vertical" &&
          props.scrollbars !== "horizontal" && (
            <ScrollArea.Corner className="fern-scroll-area-corner" />
          )}
      </ScrollArea.Root>
    );
  }
);

FernScrollArea.displayName = "FernScrollArea";
