import { UIColor } from "./colors";
export type HttpMethod = "GET" | "DELETE" | "POST" | "PUT" | "PATCH" | "HEAD" | "OPTIONS" | "CONNECT" | "TRACE";
export declare const HttpMethod: Record<HttpMethod, HttpMethod>;
export declare const HttpMethodOrder: readonly ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS", "CONNECT", "TRACE"];
export declare function isHttpMethod(value: string): value is HttpMethod;
export declare const METHOD_COLOR_SCHEMES: Record<HttpMethod, UIColor>;
//# sourceMappingURL=http-method-badge.d.ts.map