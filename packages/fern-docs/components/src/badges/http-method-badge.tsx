import { forwardRef } from "react";

import {
  HttpMethod,
  METHOD_COLOR_SCHEMES,
} from "@fern-api/docs-utils/src/http-method-badge";

import { Badge, BadgeProps } from "./badge";

/**
 * Abbreviated method names for smaller (fixed-width) badges.
 */
const ABBREVIATED_METHODS: Record<HttpMethod, string> = {
  GET: "GET",
  DELETE: "DEL",
  POST: "POST",
  PUT: "PUT",
  PATCH: "PATCH",
  HEAD: "HEAD",
  OPTIONS: "OPT",
  CONNECT: "CON",
  TRACE: "TRACE",
};

export interface HttpMethodBadgeProps extends Omit<BadgeProps, "color"> {
  method: HttpMethod;
}

export const HttpMethodBadge = forwardRef<
  HTMLSpanElement & HTMLButtonElement,
  HttpMethodBadgeProps
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
