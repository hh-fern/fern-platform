import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

import { fernReplace } from "../readme/fernReplace";

let fernReplaceExample: string;
describe("fernReplace tests", () => {
  beforeAll(() => {
    fernReplaceExample = readFileSync(
      join(__dirname, "fixtures", "fern-replace", "fern-replace-example.md"),
      "utf8"
    );
  });

  it("should replace the version", async () => {
    const result = fernReplace(
      fernReplaceExample,
      new Map([["version", "4.5.6"]])
    );
    await expect(result).toMatchFileSnapshot(
      `__snapshots__/fern-replace-example-output.md`
    );
  });
});
