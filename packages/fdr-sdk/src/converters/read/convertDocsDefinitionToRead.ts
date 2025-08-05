import { mapValues } from "es-toolkit/object";

import { APIV1Db, APIV1Read, DocsV1Db, DocsV1Read } from "../../client";
import { FernRegistry } from "../../client/generated";
import { convertDbDocsConfigToRead } from "./convertDbDocsConfigToRead";

export function convertDocsDefinitionToRead({
  docsDbDefinition,
  filesV2,
  apis,
  apisV2,
  apiSpecs,
  id,
}: {
  docsDbDefinition: DocsV1Db.DocsDefinitionDb;
  filesV2: Record<DocsV1Read.FileId, DocsV1Read.File_>;
  apis: Record<DocsV1Db.ApiDefinitionId, APIV1Read.ApiDefinition>;
  apisV2: Record<
    FernRegistry.ApiDefinitionId,
    FernRegistry.api.latest.ApiDefinition
  >;
  apiSpecs: FernRegistry.ApiSpecs | undefined;
  id: APIV1Db.DocsConfigId | undefined;
}): DocsV1Read.DocsDefinition {
  return {
    pages: docsDbDefinition.pages,
    apis,
    apisV2,
    files: mapValues(filesV2, (fileV2) => fileV2.url),
    filesV2,
    apiSpecs,
    jsFiles:
      docsDbDefinition.type === "v3" ? docsDbDefinition.jsFiles : undefined,
    id,
    config: convertDbDocsConfigToRead({ dbShape: docsDbDefinition.config }),
  };
}
