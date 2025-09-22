import { mapValues } from "es-toolkit/object";

import type { DocsV2Read } from "../../client";

export function toPages(
  docs: DocsV2Read.LoadDocsForUrlResponse
): Record<string, string> {
  return mapValues(docs.definition.pages, (page) => page.markdown);
}
