"use client";

import { createContext } from "react";

import { DashboardFileResolver } from "@fern-api/docs-server/dashboard-file-resolver";
import { FileData } from "@fern-api/docs-utils/types/file-data";

export const FileResolverContext = createContext<{
  resolveFileSrc: DashboardFileResolver["getResolvedFileData"];
}>({
  resolveFileSrc: () => undefined,
});

export const FileResolverProvider = ({
  children,
  files,
}: {
  children: React.ReactNode;
  files: Record<string, FileData>;
}) => {
  console.log("🔧 FileResolverProvider created with files:", {
    fileCount: Object.keys(files).length,
    fileKeys: Object.keys(files).slice(0, 5),
  });

  const fileResolver = new DashboardFileResolver(files);

  // Wrap the resolver to add more logging
  const resolveFileSrc = (src: string | undefined) => {
    console.log(
      "🎯 FileResolverProvider resolveFileSrc wrapper called with:",
      src
    );
    return fileResolver.getResolvedFileData(src);
  };

  return (
    <FileResolverContext.Provider value={{ resolveFileSrc }}>
      {children}
    </FileResolverContext.Provider>
  );
};
