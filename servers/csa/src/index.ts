import * as dotenv from "dotenv";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

import { executeBash } from "./executors/bash";
import { executePython } from "./executors/python";
import { parseTxt } from "./parsers/txt";
import { suggestFix } from "./utils/applyAi";

dotenv.config();

interface FileResults {
  filePath: string;
  total: number;
  passed: number;
  failed: number;
  diff: number;
}

async function processFile(filePath: string): Promise<FileResults> {
  console.log(`\nProcessing file: ${filePath}`);
  const content = readFileSync(filePath, "utf-8");
  const blocks = parseTxt(content);

  let passed = 0;
  let failed = 0;
  let diff = 0;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    console.log(`Analyzing code snippet ${i + 1}/${blocks.length}...`);

    let result;
    try {
      switch (block.language) {
        case "bash":
        case "sh":
          result = await executeBash(
            block.content,
            block.expectedOutput,
            block.startLine,
            block.endLine,
            filePath
          );
          break;
        case "python":
        case "py":
          result = await executePython(
            block.content,
            block.expectedOutput,
            block.startLine,
            block.endLine,
            filePath
          );
          break;
        default:
          console.log(`Unsupported language: ${block.language}`);
          failed++;
          continue;
      }

      if (result.success) {
        passed++;
      } else {
        failed++;
        console.log("Failed");
        if (result.error) {
          console.log(`Error: ${result.error}`);
          // Try to fix the error
          try {
            const apiKey = process.env.ANTHROPIC_API_KEY;
            if (!apiKey) {
              console.error(
                "ANTHROPIC_API_KEY environment variable is not set"
              );
              continue;
            }
            await suggestFix(
              filePath,
              {
                expected: block.expectedOutput || "",
                actual: result.output || "",
                startLine: block.startLine,
                endLine: block.endLine,
                error: result.error,
              },
              apiKey
            );
          } catch (fixError) {
            console.error("Failed to apply fix:", fixError);
          }
        }
      }

      if (result.diff) {
        diff++;
      }
    } catch (error) {
      failed++;
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.log(`Error: ${errorMessage}`);
      // Try to fix the error
      try {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
          console.error("ANTHROPIC_API_KEY environment variable is not set");
          continue;
        }
        await suggestFix(
          filePath,
          {
            expected: block.expectedOutput || "",
            actual: "",
            startLine: block.startLine,
            endLine: block.endLine,
            error: errorMessage,
          },
          apiKey
        );
      } catch (fixError) {
        console.error("Failed to apply fix:", fixError);
      }
    }
  }

  return {
    filePath,
    total: blocks.length,
    passed,
    failed,
    diff,
  };
}

async function main() {
  const dirPath = process.argv[2];
  if (!dirPath) {
    console.error("Please provide a directory path");
    process.exit(1);
  }

  const files = readdirSync(dirPath)
    .filter((file) => file.endsWith(".txt"))
    .map((file) => join(dirPath, file));

  if (files.length === 0) {
    console.error("No .txt files found in the specified directory");
    process.exit(1);
  }

  const results: FileResults[] = [];

  for (const file of files) {
    const result = await processFile(file);
    results.push(result);
  }

  // Print summary
  console.log("\n=== Code Snippet Audit ===");
  for (const result of results) {
    if (result.failed > 0 || result.diff > 0) {
      console.log(`\nFile: ${result.filePath}`);
      if (result.failed > 0) {
        console.log(`Applied fixes to ${result.failed} failing code snippets`);
      }
      if (result.diff > 0) {
        console.log(`Updated expected output for ${result.diff} code snippets`);
      }
    }
  }
}

main().catch((error: unknown) => {
  console.error("Error:", error);
  process.exit(1);
});
