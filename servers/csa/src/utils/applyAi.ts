// suggest a fix to address any diff.
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync } from "fs";

interface Diff {
  expected: string;
  actual: string;
  startLine: number;
  endLine: number;
  error?: string;
}

interface FixInfo {
  startLine: number;
  endLine: number;
  content: string;
}

export async function suggestFix(
  filePath: string,
  diff: Diff,
  anthropicApiKey: string
): Promise<void> {
  if (!anthropicApiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is required");
  }

  if (!diff.error) {
    console.log("No error detected, skipping fix suggestion");
    return;
  }

  const anthropic = new Anthropic({ apiKey: anthropicApiKey });
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  // Add line numbers to the content for better context
  const numberedContent = lines
    .map((line, index) => `${index + 1}: ${line}`)
    .join("\n");

  const prompt = `I have detected an error in a code block in my documentation. The details are as follows:

The code block produced an error:
${diff.error}

Here is the file with line numbers:
${numberedContent}

The code block that needs to be fixed is from lines ${diff.startLine} to ${diff.endLine}.
The error is related to the MongoDB aggregation pipeline structure.

Please provide the fix in the following format:
START_LINE: <line number>
END_LINE: <line number>
CONTENT:
<content to replace>

Important:
1. The line numbers in your response MUST match the line numbers shown above
2. Only include the lines that need to be changed
3. Maintain the same indentation as the original file
4. Make sure to fix the MongoDB aggregation pipeline structure
5. The 'index' property should be inside the $search stage
6. Remove any duplicate or misplaced code blocks`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    const suggestedFix =
      response.content[0].type === "text" ? response.content[0].text : "";
    if (!suggestedFix.trim()) {
      throw new Error("No fix was suggested");
    }

    const fixInfo = parseFixInfo(suggestedFix);
    if (!fixInfo) {
      throw new Error("Invalid response format");
    }

    applyFix(filePath, lines, fixInfo);
  } catch (error) {
    console.error("Error getting fix suggestion:", error);
    throw error;
  }
}

function parseFixInfo(suggestedFix: string): FixInfo | null {
  // Try both formats: separate lines and combined format
  const combinedMatch = suggestedFix.match(
    /START_LINE:\s*(\d+)\s*END_LINE:\s*(\d+)\s*CONTENT:\s*([\s\S]*?)(?=\n\n|$)/
  );

  if (combinedMatch) {
    return {
      startLine: parseInt(combinedMatch[1]),
      endLine: parseInt(combinedMatch[2]),
      content: combinedMatch[3].trim(),
    };
  }

  const startLineMatch = suggestedFix.match(/START_LINE:\s*(\d+)/);
  const endLineMatch = suggestedFix.match(/END_LINE:\s*(\d+)/);
  const contentMatch = suggestedFix.match(/CONTENT:\s*([\s\S]*?)(?=\n\n|$)/);

  if (startLineMatch && endLineMatch && contentMatch) {
    return {
      startLine: parseInt(startLineMatch[1]),
      endLine: parseInt(endLineMatch[1]),
      content: contentMatch[1].trim(),
    };
  }

  return null;
}

function applyFix(filePath: string, lines: string[], fixInfo: FixInfo): void {
  const { startLine, endLine, content } = fixInfo;

  // Get the indentation from the first line of the block being replaced
  const originalFirstLine = lines[startLine - 1];
  const indentation = originalFirstLine.match(/^\s*/)?.[0] || "";

  // Split the new content into lines and apply indentation
  const newLines = content.split("\n").map((line, index) => {
    // For the first line, use the original indentation
    if (index === 0) {
      return indentation + line;
    }

    // For subsequent lines, calculate relative indentation
    const originalLine = lines[startLine + index - 1];
    if (originalLine) {
      const originalIndent = originalLine.match(/^\s*/)?.[0] || "";
      const lineIndent = line.match(/^\s*/)?.[0] || "";
      return originalIndent + line.slice(lineIndent.length);
    }

    // If no original line exists, use the base indentation
    return indentation + line;
  });

  // Update the file with the new content
  const beforeLines = lines.slice(0, startLine - 1);
  const afterLines = lines.slice(endLine);
  const updatedLines = [...beforeLines, ...newLines, ...afterLines];

  writeFileSync(filePath, updatedLines.join("\n"), "utf-8");
  console.log("\nSuggested fix applied...\n");
}
