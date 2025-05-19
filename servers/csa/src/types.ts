import { ChangeObject } from "diff";

export interface CodeBlock {
  content: string;
  language: string;
  startLine: number;
  endLine: number;
  expectedOutput?: string;
}

export interface ExecutionResult {
  success: boolean;
  error?: string;
  output?: string;
  diff?: ChangeObject<string>[];
  fileLocation?: string;
  startLine?: number;
  endLine?: number;
}
