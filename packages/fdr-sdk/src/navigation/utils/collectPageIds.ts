import {
  type NavigationNode,
  type PageId,
  isPage,
  traverseDF,
} from "../versions/latest";
import { getPageId } from "../versions/latest/getPageId";

export function collectPageIds(nav: NavigationNode): Set<PageId> {
  const pageIds = new Set<PageId>();
  traverseDF(nav, (node) => {
    if (isPage(node)) {
      const pageId = getPageId(node);
      if (pageId != null) {
        pageIds.add(pageId);
      }
    }
  });
  return pageIds;
}
