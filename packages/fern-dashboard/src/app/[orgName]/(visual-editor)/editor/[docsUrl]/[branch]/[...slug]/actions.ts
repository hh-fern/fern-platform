"use server";

import { EditableDocsLoader, MdxDependencies } from "@fern-api/docs-loader";

let currentLoader: EditableDocsLoader | null = null;

export async function setCurrentLoader(loader: EditableDocsLoader) {
  currentLoader = loader;
}

export async function updateDependencies(
  fileName: string,
  dependencies: MdxDependencies
) {
  if (!currentLoader) {
    throw new Error("No loader available");
  }
  currentLoader.updateDependencies(fileName, dependencies);
}

export async function stageChanges(
  fileName: string,
  dependencies: MdxDependencies
) {
  if (!currentLoader) {
    throw new Error("No loader available");
  }
  currentLoader.stageChanges(fileName, dependencies);
}
