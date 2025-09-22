import type { DocsUrl } from "./types";

export function constructDocsUrlParam(docsUrl: DocsUrl): string {
  return encodeURIComponent(docsUrl);
}
