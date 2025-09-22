import type { LoadDocsForUrlResponse } from "../../client/generated/api/resources/docs/resources/v2/resources/read/types/LoadDocsForUrlResponse";
import { FernNavigationV1ToLatest } from "../migrators/v1ToV2";
import type { RootNode } from "../versions/latest";
import { toRootNode as toRootNodeV1 } from "../versions/v1";
import { mutableUpdatePointsTo } from "./updatePointsTo";

export function toRootNode(
  docs: LoadDocsForUrlResponse,
  disableEndpointPairs: boolean = false,
  paginated?: boolean
): RootNode {
  const v1 = toRootNodeV1(docs, disableEndpointPairs, paginated);
  const latest = FernNavigationV1ToLatest.create().root(v1);
  // update all `pointsTo`
  mutableUpdatePointsTo(latest);
  return latest;
}
