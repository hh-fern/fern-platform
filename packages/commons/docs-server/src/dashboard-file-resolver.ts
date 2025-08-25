import { FileData } from "@fern-api/docs-utils/types/file-data";
import { FernNavigation } from "@fern-api/fdr-sdk";

export function createDashboardFileResolver(files: Record<string, FileData>) {
  const filePathToFileIdMap: Record<string, FernNavigation.FileId> = {};
  for (const [fileId, file] of Object.entries(files)) {
    const path = extractPathAfterDate(file.src) || file.src;
    filePathToFileIdMap[path] = FernNavigation.FileId(fileId);
  }

  async function resolveFileSrc(src: string | undefined) {
    if (src == null) {
      return undefined;
    }

    let fileId: FernNavigation.FileId | undefined;

    // if the src is a file path, we use the file id from the map
    if (filePathToFileIdMap[src]) {
      fileId = filePathToFileIdMap[src];
    } else {
      // otherwise, we assume the src is a file id
      fileId = FernNavigation.FileId(
        src.startsWith("file:") ? src.slice(5) : src
      );
    }

    const file = files[fileId];

    if (file == null) {
      // the file is not found, so we return the src as the image data
      return { src };
    }

    return file;
  }

  return resolveFileSrc;
}

/**
 * Extracts the path from the src, e.g.:
 * https://files.buildwithfern.com/sarahbawabe.docs.buildwithfern.com/2025-08-22T16:59:23.340Z/docs/assets/logo-light.svg
 * to docs/assets/logo-light.svg
 */
function extractPathAfterDate(url: string) {
  // Regular expression to match ISO date pattern
  const datePattern = /\/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/;
  // Split by the date pattern and take everything after the first match
  const parts = url.split(datePattern);
  return parts.length > 1 ? parts[1] : "";
}
