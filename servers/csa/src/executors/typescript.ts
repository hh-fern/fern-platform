import { execSync } from "child_process";
import { unlinkSync, writeFileSync } from "fs";
import { resolve } from "path";

import { CodeBlock, ExecutionResult } from "../types";

export function executeTypeScript(
  block: CodeBlock,
  index: number,
  filePath: string
): ExecutionResult {
  const tempFile = `temp_${index}.ts`;
  try {
    const wrappedCode = `${block.content
      .split("\n")
      .filter((line) => line.trim().startsWith("import"))
      .join("\n")}\n\n(async () => {\n  ${block.content
      .split("\n")
      .filter((line) => !line.trim().startsWith("import"))
      .join("\n  ")}\n})().catch(console.error);`;
    writeFileSync(tempFile, wrappedCode);

    try {
      const output = execSync(`ts-node ${tempFile}`, {
        stdio: "pipe",
        env: {
          ...process.env,
          TS_NODE_PROJECT: resolve(process.cwd(), "tsconfig.json"),
        },
      }).toString();
      return { success: true, output };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`\nError in ${filePath}:${block.startLine}:`);
      console.error("Error:");
      const cleanError = errorMessage
        .replace(/Command failed:.*\n/, "")
        .replace(/temp_\d+\.ts/g, "codeSnippet");
      console.error(cleanError);
      return { success: false, error: cleanError };
    } finally {
      try {
        unlinkSync(tempFile);
      } catch (_) {
        // Ignore cleanup errors
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `\nError creating temporary file for ${filePath}:${block.startLine}-${block.endLine}:`,
      errorMessage
    );
    return { success: false, error: errorMessage };
  }
}
