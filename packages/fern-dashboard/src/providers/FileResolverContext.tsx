"use client";

import type { Context } from "react";
import { createContext, useContext } from "react";

import { DashboardFileResolver } from "@fern-api/docs-server/dashboard-file-resolver";
import type { FileData } from "@fern-api/docs-utils/types/file-data";

type FileResolverContextValue = {
  resolveFileSrc: DashboardFileResolver["getResolvedFileData"];
};

export const FileResolverContext: Context<FileResolverContextValue> =
  createContext<FileResolverContextValue>({
    resolveFileSrc: () => undefined,
  });

export const FileResolverProvider = ({
  children,
  files,
}: {
  children: React.ReactNode;
  files: Record<string, FileData>;
}): React.JSX.Element => {
  const fileResolver = new DashboardFileResolver(files);

  const resolveFileSrc = (src: string | undefined) =>
    fileResolver.getResolvedFileData(src);

  return (
    <FileResolverContext.Provider value={{ resolveFileSrc }}>
      {children}
    </FileResolverContext.Provider>
  );
};

export const useFileResolver = (): FileResolverContextValue => {
  return useContext(FileResolverContext);
};
