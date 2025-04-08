// utils/fsmap.ts
import fs from "fs";
import path from "path";

import { FileData } from "@/server/types";

// Common packages that might need their type definitions
const COMMON_DEPENDENCIES = [
  "@types/react",
  "@types/node",
  "typescript",
  "@aa-sdk/core",
  "@account-kit/core",
  "@account-kit/infra",
  "@account-kit/smart-contracts",
  // Add other common packages used in your documentation examples
];

// Type for the cache key
type FsMapCacheKey = string;

// Cache for FSMaps
const fsMapCache = new Map<FsMapCacheKey, Map<string, string>>();

/**
 * Generate a cache key for the FSMap
 */
function generateFsMapCacheKey(
  files: Record<string, string>,
  remoteFiles: Record<string, FileData>
): FsMapCacheKey {
  // Create a key based on the file paths
  const filesKey = Object.keys(files).sort().join(",");
  const remoteFilesKey = Object.keys(remoteFiles).sort().join(",");

  return `${filesKey}|${remoteFilesKey}`;
}

/**
 * Create or retrieve a cached fsMap for twoslash
 */
export function getOrCreateTwoslashFsMap(
  files: Record<string, string>,
  remoteFiles: Record<string, FileData>,
  options?: {
    additionalDependencies?: string[];
    rootDir?: string;
    forceRefresh?: boolean;
  }
): Map<string, string> {
  const cacheKey = generateFsMapCacheKey(files, remoteFiles);

  // If we have a cached version and don't need to refresh, return it
  if (!options?.forceRefresh && fsMapCache.has(cacheKey)) {
    const cachedMap = fsMapCache.get(cacheKey);
    if (cachedMap) {
      return cachedMap;
    }
  }

  // Otherwise, create a new fsMap
  const fsMap = createTwoslashFsMap(files, remoteFiles, options);

  // Cache it for future use
  fsMapCache.set(cacheKey, fsMap);

  return fsMap;
}

/**
 * Create an fsMap for twoslash that includes local files, remote files,
 * and type definitions for common dependencies.
 */
export function createTwoslashFsMap(
  files: Record<string, string>,
  remoteFiles: Record<string, FileData>,
  options?: {
    additionalDependencies?: string[];
    rootDir?: string;
  }
): Map<string, string> {
  const fsMap = new Map<string, string>();
  const rootDir = options?.rootDir || process.cwd();

  // Add local files to the fsMap
  Object.entries(files).forEach(([filepath, content]) => {
    fsMap.set(filepath, content);
  });

  // Add remote files to the fsMap
  Object.entries(remoteFiles).forEach(([filepath, fileData]) => {
    if (typeof fileData.src === "string") {
      fsMap.set(filepath, fileData.src);
    }
  });

  // Add type definitions for common dependencies
  const dependencies = [
    ...COMMON_DEPENDENCIES,
    ...(options?.additionalDependencies || []),
  ];

  // Try to load TypeScript lib files
  try {
    const tsLibFolder = path.join(rootDir, "node_modules", "typescript", "lib");

    if (fs.existsSync(tsLibFolder)) {
      const libFiles = [
        "lib.dom.d.ts",
        "lib.es2020.d.ts",
        "lib.esnext.d.ts",
        "lib.dom.iterable.d.ts",
      ];

      libFiles.forEach((libFile) => {
        const libPath = path.join(tsLibFolder, libFile);
        if (fs.existsSync(libPath)) {
          const content = fs.readFileSync(libPath, "utf8");
          fsMap.set(libFile, content);
        }
      });
    }
  } catch (error) {
    console.warn("Failed to load TypeScript lib files:", error);
  }

  // Try to load dependency type definitions
  dependencies.forEach((packageName) => {
    try {
      // Check if it's a @types package or a direct package
      const packagePath = path.join(rootDir, "node_modules", packageName);

      if (fs.existsSync(packagePath)) {
        // Try to find the package.json
        const packageJsonPath = path.join(packagePath, "package.json");

        if (fs.existsSync(packageJsonPath)) {
          const packageJson = JSON.parse(
            fs.readFileSync(packageJsonPath, "utf8")
          );

          // Check for types or typings entry
          const typesEntry = packageJson.types || packageJson.typings;

          if (typesEntry) {
            const typesPath = path.join(packagePath, typesEntry);

            if (fs.existsSync(typesPath)) {
              const content = fs.readFileSync(typesPath, "utf8");
              fsMap.set(
                // Virtual path that TypeScript can resolve
                `node_modules/${packageName}/${typesEntry}`,
                content
              );

              // Also add it as a direct import path
              fsMap.set(
                packageName,
                `export * from "node_modules/${packageName}/${typesEntry}";`
              );
            }
          }

          // Also look for index.d.ts
          const indexDtsPath = path.join(packagePath, "index.d.ts");
          if (fs.existsSync(indexDtsPath)) {
            const content = fs.readFileSync(indexDtsPath, "utf8");
            fsMap.set(`node_modules/${packageName}/index.d.ts`, content);

            // Also add it as a direct import path if no types entry was found
            if (!typesEntry) {
              fsMap.set(
                packageName,
                `export * from "node_modules/${packageName}/index.d.ts";`
              );
            }
          }
        }
      }
    } catch (error) {
      console.warn(
        `Failed to load type definitions for ${packageName}:`,
        error
      );
    }
  });

  // Add custom type declarations
  fsMap.set(
    "custom.d.ts",
    `
    // Custom type declarations for documentation examples
    
    // Declare image imports
    declare module '*.png' {
      const value: string;
      export default value;
    }
    
    declare module '*.jpg' {
      const value: string;
      export default value;
    }
    
    declare module '*.svg' {
      import React from 'react';
      const SVG: React.FC<React.SVGProps<SVGSVGElement>>;
      export default SVG;
    }
    
    // Declare style imports
    declare module '*.css' {
      const content: Record<string, string>;
      export default content;
    }
    
    declare module '*.scss' {
      const content: Record<string, string>;
      export default content;
    }
    
    // Declare JSON imports
    declare module '*.json' {
      const value: any;
      export default value;
    }
    
    // Add other declarations as needed
  `
  );

  return fsMap;
}

// Helper function to recursively load all .d.ts files from a directory
export function loadTypeDefinitionsFromDirectory(
  directory: string,
  basePath: string = ""
): Record<string, string> {
  const result: Record<string, string> = {};

  if (!fs.existsSync(directory)) {
    return result;
  }

  const entries = fs.readdirSync(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    const relativePath = basePath
      ? path.join(basePath, entry.name)
      : entry.name;

    if (entry.isDirectory()) {
      const nestedDefinitions = loadTypeDefinitionsFromDirectory(
        fullPath,
        relativePath
      );
      Object.assign(result, nestedDefinitions);
    } else if (entry.name.endsWith(".d.ts")) {
      result[relativePath] = fs.readFileSync(fullPath, "utf8");
    }
  }

  return result;
}
