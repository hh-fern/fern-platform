import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

function extractCodeBlocks(content: string): string[] {
  const codeBlockRegex = /```[\s\S]*?```/g;
  const matches = content.match(codeBlockRegex);

  if (matches) {
    return matches.map((block) => {
      // Remove the ``` markers and trim
      return block
        .replace(/^```.*\n/, "")
        .replace(/```$/, "")
        .trim();
    });
  }

  return [];
}

function main() {
  // Get the file path from command line arguments
  const args = process.argv.slice(2);
  console.log("args: ", args);
  const filePath = args[args.length - 1]; // Get the last argument
  console.log("file path: ", filePath);

  if (!filePath) {
    console.error("Please provide a file path as a command line argument");
    console.error("Usage: pnpm audit <file-path>");
    process.exit(1);
  } else {
    console.log("using and moving forward...");
    // process.exit(0);
  }

  // Resolve the file path relative to the current working directory
  const resolvedPath = resolve(process.cwd(), filePath);
  console.log(`Reading file: ${resolvedPath}`);

  try {
    // Check if file exists
    if (!existsSync(resolvedPath)) {
      console.error(`Error: File not found at path: ${resolvedPath}`);
      process.exit(1);
    }

    // Read the file as UTF-8 text
    const content = readFileSync(resolvedPath, { encoding: "utf-8" });
    console.log(`Successfully read file (${content.length} characters)`);

    // Extract code blocks
    const codeBlocks = extractCodeBlocks(content);
    console.log(`Found ${codeBlocks.length} code blocks`);

    // Output each code block
    codeBlocks.forEach((block, index) => {
      console.log(`\nCode Block ${index + 1}:`);
      console.log("---");
      console.log(block);
      console.log("---\n");
    });

    if (codeBlocks.length === 0) {
      console.log("No code blocks found in the file.");
    }
  } catch (error) {
    console.error("Error reading file:", error);
    process.exit(1);
  }

  // Ensure the process exits
  process.exit(0);
}

main();
