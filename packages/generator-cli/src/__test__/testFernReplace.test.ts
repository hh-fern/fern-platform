import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

import { fernReplace } from "../readme/fernReplace";

let squareReadme: string;
describe("fernReplace tests", () => {
  beforeAll(() => {
    squareReadme = readFileSync(join(__dirname, "squareReadme.md"), "utf8");
  });

  it("should replace the version", () => {
    const result = fernReplace(squareReadme, new Map([["version", "46.0.0"]]));
    expect(result).toContain("46.0.0");
    expect(result).not.toContain("44.0.0.20250319");
  });
});
