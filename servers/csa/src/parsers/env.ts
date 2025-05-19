import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

export function loadEnvironmentVariables(): Record<string, string> {
  const envPath = resolve(process.cwd(), ".fern.env");
  if (!existsSync(envPath)) {
    return {};
  }

  const envContent = readFileSync(envPath, { encoding: "utf-8" });
  const envVars: Record<string, string> = {};

  envContent.split("\n").forEach((line) => {
    line = line.trim();
    if (line && !line.startsWith("#")) {
      const match = line.match(/^"([^"]+)"="([^"]+)"$/);
      if (match) {
        const [, key, value] = match;
        envVars[key] = value;
      }
    }
  });

  return envVars;
}

export function replaceEnvironmentVariables(
  content: string,
  envVars: Record<string, string>
): string {
  let result = content;

  for (const [key, value] of Object.entries(envVars)) {
    const regex = new RegExp(key, "g");
    const matches = (result.match(regex) || []).length;
    if (matches > 0) {
      result = result.replace(regex, value);
    }
  }

  return result;
}
