import React, { ComponentProps, PropsWithChildren } from "react";

import { last } from "es-toolkit/array";

import { FernLogger } from "@/utils/logging/logger";
import { DashboardError } from "@/utils/logging/errors";

import { FernLink } from "@fern-docs/components/FernLink";

import { Button } from "../button";
import { Card } from "../card";
import { A } from "../html";

export function Download({
  children,
  src,
  filename,
}: PropsWithChildren<{ src?: string; filename?: string }>) {
  if (!src) {
    return children;
  }

  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    // enable downloads from the same origin, or data urls
    if (
      src.startsWith(window.location.origin + "/") ||
      src.startsWith("data:")
    ) {
      return;
    }

    e.preventDefault();
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      // if the filename is not provided, use the last part of the src
      a.download = filename || last(src.split("/")) || "";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      FernLogger.error(DashboardError.DOWNLOAD_COMPONENT_ERROR, error, {
        component: "Download",
        function: "handleClick",
        src,
        filename,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      // if we can't download the file, open it in a new tab
      window.open(src, "_blank");
    }
  };

  if (
    React.isValidElement<ComponentProps<typeof FernLink>>(children) &&
    (children.type === A || children.type === Card || children.type === Button)
  ) {
    return React.cloneElement(children, {
      href: src,
      download: filename || true,
      onClick: (e) => {
        void (async () => {
          try {
            await handleClick(e);
          } catch (e) {
            FernLogger.error(DashboardError.DOWNLOAD_COMPONENT_ERROR, e, {
              component: "Download",
              function: "cloneElement onClick",
              src,
              filename,
              errorMessage: e instanceof Error ? e.message : String(e),
            });
          }
        })();
      },
    });
  }

  return (
    <A
      href={src}
      download={filename || true}
      onClick={(e) => {
        void (async () => {
          try {
            await handleClick(e);
          } catch (e) {
            FernLogger.error(DashboardError.DOWNLOAD_COMPONENT_ERROR, e, {
              component: "Download",
              function: "cloneElement onClick",
              src,
              filename,
              errorMessage: e instanceof Error ? e.message : String(e),
            });
          }
        })();
      }}
    >
      {children}
    </A>
  );
}
