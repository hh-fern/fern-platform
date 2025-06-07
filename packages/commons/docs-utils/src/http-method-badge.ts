import { UIColor } from "./colors";

// import { UIColor } from "../../../fern-docs/components/src/colors";
// import { Badge, BadgeProps } from "../../../fern-docs/components/src/badges/badge";

export type HttpMethod =
  | "GET"
  | "DELETE"
  | "POST"
  | "PUT"
  | "PATCH"
  | "HEAD"
  | "OPTIONS"
  | "CONNECT"
  | "TRACE";
export const HttpMethod: Record<HttpMethod, HttpMethod> = {
  GET: "GET",
  DELETE: "DELETE",
  POST: "POST",
  PUT: "PUT",
  PATCH: "PATCH",
  HEAD: "HEAD",
  OPTIONS: "OPTIONS",
  CONNECT: "CONNECT",
  TRACE: "TRACE",
} as const;

export const HttpMethodOrder = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
  "CONNECT",
  "TRACE",
] as const;

export function isHttpMethod(value: string): value is HttpMethod {
  return HttpMethod[value as keyof typeof HttpMethod] != null;
}

export const METHOD_COLOR_SCHEMES: Record<HttpMethod, UIColor> = {
  GET: "green",
  DELETE: "red",
  POST: "blue",
  PUT: "amber",
  PATCH: "orange",
  HEAD: "gray",
  OPTIONS: "bronze",
  CONNECT: "sky",
  TRACE: "purple",
};
