import { CodeBlock } from "../types";
import { loadEnvironmentVariables, replaceEnvironmentVariables } from "./env";

export function parseMdx(content: string): CodeBlock[] {
  const codeBlockRegex = /```(\w+)(?:\s+(\S+))?\n([\s\S]*?)```/g;
  const blocks: CodeBlock[] = [];
  let match;

  // Load environment variables once for all blocks
  const envVars = loadEnvironmentVariables();

  while ((match = codeBlockRegex.exec(content)) != null) {
    const language = match[1]?.toLowerCase() || "";
    const filename = match[2] || "";
    let code = match[3].trim();

    // Replace environment variables in the code
    code = replaceEnvironmentVariables(code, envVars);

    // Calculate line numbers
    const startLine = content.substring(0, match.index).split("\n").length;
    const endLine = startLine + code.split("\n").length;

    blocks.push({
      content: filename ? `${language} ${filename}\n${code}` : code,
      language,
      startLine,
      endLine,
    });
  }

  return blocks;
}
