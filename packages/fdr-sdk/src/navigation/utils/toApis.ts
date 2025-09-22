import { mapValues } from "es-toolkit/object";

import type { ApiDefinition } from "../../api-definition/latest";
import { ApiDefinitionV1ToLatest } from "../../api-definition/migrators/v1ToV2";
import type { DocsV2Read } from "../../client";

export function toApis(
  docs: DocsV2Read.LoadDocsForUrlResponse
): Record<string, ApiDefinition> {
  return {
    ...mapValues(docs.definition.apis, (api) =>
      ApiDefinitionV1ToLatest.from(api, {
        useJavaScriptAsTypeScript: false,
        alwaysEnableJavaScriptFetch: false,
        usesApplicationJsonInFormDataValue: false,
      }).migrate()
    ),
    ...docs.definition.apisV2,
  };
}
