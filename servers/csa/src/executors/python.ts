import { spawn } from "child_process";
import fs from "fs/promises";
import os from "os";
import path from "path";

import { ExecutionResult } from "../types";
import { generateDiff, normalizeOutput } from "../utils/diff";

const createdFiles: string[] = [];
const venvDir = path.join(os.tmpdir(), "python_venv");

async function setupVenv(): Promise<void> {
  try {
    // Create virtual environment if it doesn't exist
    await fs.mkdir(venvDir, { recursive: true });
    await new Promise<void>((resolve, reject) => {
      const process = spawn("python3", ["-m", "venv", venvDir]);
      process.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Failed to create virtual environment: ${code}`));
        }
      });
    });

    // Install required packages
    const pipPath = path.join(venvDir, "bin", "pip3");

    await new Promise<void>((resolve, reject) => {
      const process = spawn(pipPath, ["install", "pymongo"]);
      process.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Failed to install pymongo: ${code}`));
        }
      });
    });
  } catch (error) {
    console.error("Error setting up virtual environment:", error);
    throw error;
  }
}

export async function executePython(
  code: string,
  expectedOutput?: string,
  startLine?: number,
  endLine?: number,
  filePath?: string
): Promise<ExecutionResult> {
  try {
    // Ensure virtual environment is set up
    await setupVenv();

    // Create a temporary file for the code with a unique name
    const timestamp = Date.now();
    const tempFile = path.join(os.tmpdir(), `codeSnippet_${timestamp}.py`);
    await fs.writeFile(tempFile, code);
    createdFiles.push(tempFile);

    return await new Promise((resolve) => {
      const pythonPath = path.join(venvDir, "bin", "python3");
      const process = spawn(pythonPath, [tempFile]);
      let stdout = "";
      let stderr = "";

      process.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      process.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      // Add a timeout of 10 seconds
      const timeoutId = setTimeout(() => {
        process.kill();
        resolve({
          success: false,
          output: "",
          error: "Execution timed out after 10 seconds",
        });
      }, 10000);

      process.on("close", (_code) => {
        // Clear the timeout since execution completed
        clearTimeout(timeoutId);

        // Only treat stderr as an error if it's not a notice or warning
        if (
          stderr &&
          !stderr.toLowerCase().includes("notice") &&
          !stderr.toLowerCase().includes("warning")
        ) {
          resolve({
            success: false,
            output: stderr,
            error: stderr,
            startLine,
            endLine,
            fileLocation: filePath,
          });
          return;
        }

        const actualOutput = stdout.trim();

        let diff;
        if (expectedOutput) {
          diff = generateDiff(
            actualOutput,
            normalizeOutput(expectedOutput),
            filePath,
            startLine
          );
        }
        resolve({
          success: true,
          output: actualOutput,
          diff: diff,
          fileLocation: filePath,
          startLine,
          endLine,
        });
      });
    });
  } catch (error) {
    return {
      success: false,
      output: "",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function cleanupFiles(): Promise<void> {
  for (const file of createdFiles) {
    try {
      await fs.unlink(file);
    } catch (_) {
      // Ignore cleanup errors
    }
  }
  // Clean up virtual environment
  try {
    await fs.rm(venvDir, { recursive: true, force: true });
  } catch (_) {
    // Ignore cleanup errors
  }
}
