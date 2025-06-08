import { FernNavigation } from "@fern-api/fdr-sdk";
import { PruningNodeType } from "@fern-api/fdr-sdk/api-definition";

export function createPruneKey(
  node: FernNavigation.NavigationNodeApiLeaf
): PruningNodeType {
  switch (node.type) {
    case "endpoint":
      return {
        type: "endpoint",
        endpointId: node.endpointId,
      };
    case "webSocket":
      return {
        type: "webSocket",
        webSocketId: node.webSocketId,
      };
    case "webhook":
      return {
        type: "webhook",
        webhookId: node.webhookId,
      };
    default:
      throw new Error(`Unknown node type: ${node}`);
  }
}
