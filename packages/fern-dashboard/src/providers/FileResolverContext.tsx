"use client";

import { createContext } from "react";

import { createDashboardFileResolver } from "@fern-api/docs-server/dashboard-file-resolver";
import { FileData } from "@fern-api/docs-utils/types/file-data";

export const FileResolverContext = createContext<{
  resolveFileSrc: ReturnType<typeof createDashboardFileResolver>;
}>({
  resolveFileSrc: () => Promise.resolve(undefined),
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

  const resolveFileSrc = createDashboardFileResolver(files);

  // Wrap the resolver to add more logging
  const wrappedResolver = async (src: string | undefined) => {
    console.log(
      "🎯 FileResolverProvider resolveFileSrc wrapper called with:",
      src
    );
    const result = await resolveFileSrc(src);
    console.log("🎯 FileResolverProvider resolver returned:", result);
    return result;
  };

  return (
    <FileResolverContext.Provider value={{ resolveFileSrc: wrappedResolver }}>
      {children}
    </FileResolverContext.Provider>
  );
};
