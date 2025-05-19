import chalk from "chalk";
import { diffChars } from "diff";
import * as fs from "fs";

export function normalizeOutput(output: string) {
  return output
    .split("\n")
    .filter((line) => !line.trim().startsWith(":visible:"))
    .join("\n");
}

export function generateDiff(
  actual: string,
  expected: string,
  fileLocation?: string,
  startLine?: number
): {
  diff: { type: "added" | "removed" | "unchanged"; value: string }[];
  actual: string;
  updatedExpected: string;
  location?: { file: string; line: number };
} {
  const diff = diffChars(expected, actual);
  const normalizedDiff = diff.filter((part) => part.added || part.removed);

  const jsonDiff = diff.map((part) => ({
    type: part.added
      ? ("added" as const)
      : part.removed
        ? ("removed" as const)
        : ("unchanged" as const),
    value: part.value,
  }));

  if (normalizedDiff.length > 0) {
    diff.forEach((part) => {
      // green for additions, red for deletions
      const text = part.added
        ? chalk.bgGreen(part.value)
        : part.removed
          ? chalk.bgRed(part.value)
          : part.value;
      process.stderr.write(text);
    });

    if (fileLocation && startLine) {
      const content = fs.readFileSync(fileLocation, "utf-8");
      const lines = content.split("\n");

      let outputStartLine = -1;
      let outputEndLine = -1;
      const metadataLines: string[] = [];
      let outputIndent = "";

      // Find the output section starting from the provided startLine
      for (let i = startLine; i < lines.length; i++) {
        const line = lines[i];

        if (line.trim().startsWith(".. output::")) {
          outputStartLine = i;
          outputIndent = line.match(/^\s*/)?.[0] || "";

          // Collect metadata lines
          while (i + 1 < lines.length && lines[i + 1].trim().startsWith(":")) {
            i++;
            const metadataLine = lines[i];
            metadataLines.push(metadataLine);
          }
          outputStartLine = i + 1;
          break;
        }
      }

      // Find the end of the output section
      if (outputStartLine !== -1) {
        for (let i = outputStartLine; i < lines.length; i++) {
          const line = lines[i];
          const currentIndent = line.match(/^\s*/)?.[0] || "";
          if (currentIndent.length <= outputIndent.length) {
            outputEndLine = i;
            break;
          }
        }
      }

      if (outputStartLine !== -1) {
        const newLines = [
          ...lines.slice(0, outputStartLine - metadataLines.length),
          ...metadataLines,
        ];

        // Handle text output
        const actualLines = actual.split("\n");
        actualLines.forEach((line) => {
          newLines.push(`${outputIndent}   ${line}`);
        });

        if (outputEndLine !== -1) {
          newLines.push(...lines.slice(outputEndLine));
        }

        fs.writeFileSync(fileLocation, newLines.join("\n"));
        console.log("\nExpected output updated...\n");
      }
    }
  }

  return {
    diff: jsonDiff,
    actual,
    updatedExpected: actual,
    ...(fileLocation && startLine
      ? { location: { file: fileLocation, line: startLine } }
      : {}),
  };
}
