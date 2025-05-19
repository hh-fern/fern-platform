import { CodeBlock } from "../types";
import { loadEnvironmentVariables, replaceEnvironmentVariables } from "./env";

/**
 * Normalizes the indentation of a code string by removing the common leading whitespace
 * while preserving relative indentation between lines.
 */
function normalizeIndentation(code: string): string {
  // Split into lines and filter out empty lines at the beginning and end
  const lines = code.split("\n");
  const nonEmptyLines = lines.filter((line) => line.trim().length > 0);

  if (nonEmptyLines.length === 0) {
    return "";
  }

  // Find the minimum indentation level across non-empty lines
  const minIndent = Math.min(
    ...nonEmptyLines.map((line) => {
      const match = line.match(/^\s*/);
      return match ? match[0].length : 0;
    })
  );

  // Remove the minimum indentation from each line
  return lines
    .map((line) => {
      // Skip empty lines
      if (line.trim().length === 0) {
        return "";
      }
      const match = line.match(/^\s*/);
      return line.slice(Math.min(minIndent, match ? match[0].length : 0));
    })
    .join("\n");
}

/**
 * Parses an RST .txt file and extracts code blocks with their expected outputs.
 */
export function parseTxt(content: string): CodeBlock[] {
  const blocks: CodeBlock[] = [];

  // Load environment variables once for all blocks
  const envVars = loadEnvironmentVariables();

  // Process regular code blocks first (simpler case)
  const codeBlockRegex =
    /\.\.\s+code-block::\s*(\w+)\s*\n([\s\S]*?)(?=\n\s*\.\.\s+(?!code-block::)|$)/g;
  let codeMatch;

  while ((codeMatch = codeBlockRegex.exec(content)) != null) {
    const language = codeMatch[1].toLowerCase();
    const codeContent = normalizeIndentation(codeMatch[2]);

    // Replace environment variables in the code
    const processedCode = replaceEnvironmentVariables(codeContent, envVars);

    // Calculate line numbers (1-based)
    const startLine = content.substring(0, codeMatch.index).split("\n").length;
    const endLine = startLine + processedCode.split("\n").length - 1;

    blocks.push({
      content: processedCode,
      language,
      startLine,
      endLine,
    });
  }

  // Process io-code-blocks with input and output sections
  const ioBlockRegex =
    /\.\.\s+io-code-block::[^\n]*\n([\s\S]*?)(?=\n(?:\s*\.\.\s+(?!input::)(?!output::))|$)/g;

  let ioBlockMatch;
  while ((ioBlockMatch = ioBlockRegex.exec(content)) != null) {
    const ioBlockContent = ioBlockMatch[0];

    // Extract input section with language
    const inputMatch =
      /\.\.\s+input::[^\n]*\n\s*:language:\s*(\w+)[^\n]*\n([\s\S]*?)(?=\s*\.\.\s+output::)/s.exec(
        ioBlockContent
      );

    if (inputMatch) {
      const language = inputMatch[1].toLowerCase();
      const rawInputCode = inputMatch[2];

      // Clean and normalize the input code
      const inputCode = normalizeIndentation(rawInputCode);
      const processedCode = replaceEnvironmentVariables(inputCode, envVars);

      // Calculate input section line numbers
      const startLine =
        content.substring(0, ioBlockMatch.index).split("\n").length +
        ioBlockContent.substring(0, inputMatch.index).split("\n").length;
      const endLine = startLine + processedCode.split("\n").length - 1;

      // Extract output section
      const outputMatch =
        /\.\.\s+output::[^\n]*\n(?:\s*:[\w]+:[^\n]*\n)*\s*([\s\S]*?)(?=\n[^\s]|\n\s*$)/s.exec(
          ioBlockContent.substring(inputMatch.index + inputMatch[0].length)
        );

      let expectedOutput = "";
      if (outputMatch) {
        // Clean up the output content
        const rawOutput = outputMatch[1].trim();

        // Normalize the output content
        const normalizedOutput = normalizeIndentation(rawOutput);

        expectedOutput = normalizedOutput;
      }

      blocks.push({
        content: processedCode,
        language,
        startLine,
        endLine,
        expectedOutput,
      });
    }
  }

  return blocks;
}
