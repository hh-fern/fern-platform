import { forwardRef } from "react";

import { HttpOrWssOrGrpc } from "@fern-api/docs-utils";

import { UIColor } from "../colors";
import { Badge, BadgeProps } from "./badge";

const METHOD_COLOR_SCHEMES: Record<HttpOrWssOrGrpc, UIColor> = {
  GET: "green",
  DELETE: "red",
  POST: "blue",
  PUT: "amber",
  PATCH: "orange",
  HEAD: "gray",
  OPTIONS: "bronze",
  CONNECT: "sky",
  TRACE: "purple",
  WSS: "green",
  UNARY: "green",
  CLIENT_STREAM: "green",
  SERVER_STREAM: "green",
  BIDIRECTIONAL_STREAM: "green",
};

/**
 * Abbreviated method names for smaller (fixed-width) badges.
 */
const ABBREVIATED_METHODS: Record<HttpOrWssOrGrpc, string> = {
  GET: "GET",
  DELETE: "DEL",
  POST: "POST",
  PUT: "PUT",
  PATCH: "PATCH",
  HEAD: "HEAD",
  OPTIONS: "OPT",
  CONNECT: "CON",
  TRACE: "TRACE",
  WSS: "WSS",
  UNARY: "UNARY",
  CLIENT_STREAM: "CS",
  SERVER_STREAM: "SS",
  BIDIRECTIONAL_STREAM: "BS",
};

export interface HttpOrWSSBadgeProps extends Omit<BadgeProps, "color"> {
  method: HttpOrWssOrGrpc;
}

export const HttpMethodBadge = forwardRef<
  HTMLSpanElement & HTMLButtonElement,
  HttpOrWSSBadgeProps
>((props, ref) => {
  const { method, ...rest } = props;
  return (
    <Badge
      ref={ref}
      {...rest}
      data-badge-type="http-method"
      data-http-method={method}
      color={METHOD_COLOR_SCHEMES[method]}
    >
      {props.children ??
        (rest.size === "sm" ? ABBREVIATED_METHODS[method] : method)}
    </Badge>
  );
});

HttpMethodBadge.displayName = "HttpMethodBadge";
