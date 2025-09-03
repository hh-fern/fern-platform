import { readFileSync } from "fs";
import { join } from "path";
import { beforeAll } from "vitest";
import { ReadmeParser } from "../readme/ReadmeParser";

describe("ReadmeParser", () => {
	let parser: ReadmeParser;
	let squareReadme: string;
	beforeAll(() => {
		squareReadme = readFileSync(
			join(__dirname, "squareReadme.md"),
			"utf8",
		);
	});

	beforeEach(() => {
		parser = new ReadmeParser();
	});

	describe("basic parsing functionality", () => {
		it("should parse empty content", () => {
			const result = parser.parse({ content: "" });
			expect(result.header).toBe("");
			expect(result.blocks).toHaveLength(0);
		});

		it("should parse header without blocks", () => {
			const content = "# Main Title\n\nSome intro text";
			const result = parser.parse({ content });
			expect(result.header).toBe("# Main TitleSome intro text");
			expect(result.blocks).toHaveLength(0);
		});

		it("should parse single block", () => {
			const content = "# Header\n\n## Installation\nRun npm install";
			const result = parser.parse({ content });
			expect(result.header).toBe("# Header");
			expect(result.blocks).toHaveLength(1);
			expect(result.blocks[0]?.id).toBe("INSTALLATION");
			expect(result.blocks[0]?.content).toBe(
				"## Installation\nRun npm install\n",
			);
		});

		it("should parse multiple blocks", () => {
			const content =
				"# Header\n\n## Installation\nRun npm install\n## Usage\nImport the module";
			const result = parser.parse({ content });
			expect(result.header).toBe("# Header");
			expect(result.blocks).toHaveLength(2);
			expect(result.blocks[0]?.id).toBe("INSTALLATION");
			expect(result.blocks[0]?.content).toBe(
				"## Installation\nRun npm install\n",
			);
			expect(result.blocks[1]?.id).toBe("USAGE");
			expect(result.blocks[1]?.content).toBe("## Usage\nImport the module\n");
		});

		it("should convert section names to correct IDs", () => {
			const content = "## Quick Start Guide\nContent";
			const result = parser.parse({ content });
			expect(result.blocks[0]?.id).toBe("QUICK_START_GUIDE");
		});
	});

	describe("square readme parsing", () => {
		it("should parse square readme", () => {
			const result = parser.parse({ content: squareReadme, args: new Map([["version", "46.0.0"]]) });
			expect(result.blocks).toHaveLength(14);
      const legacySdkBlock = result.blocks.find(block => block.id === "LEGACY_SDK");
      expect(legacySdkBlock?.content).toContain("46.0.0");
      expect(legacySdkBlock?.content).not.toContain("44.0.0.20250319");
		});
	});
});
