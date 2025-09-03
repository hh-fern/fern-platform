import { ReadmeParser } from "../readme/ReadmeParser";

describe("ReadmeParser", () => {
  let parser: ReadmeParser;

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
      const content = "# Main Title\nSome intro text";
      const result = parser.parse({ content });
      expect(result.header).toBe("# Main Title\nSome intro text");
      expect(result.blocks).toHaveLength(0);
    });

    it("should parse single block", () => {
      const content = "# Header\n## Installation\nRun npm install";
      const result = parser.parse({ content });
      expect(result.header).toBe("# Header\n");
      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0]?.id).toBe("INSTALLATION");
      expect(result.blocks[0]?.content).toBe(
        "## Installation\nRun npm install\n"
      );
    });

    it("should parse multiple blocks", () => {
      const content =
        "# Header\n## Installation\nRun npm install\n## Usage\nImport the module";
      const result = parser.parse({ content });
      expect(result.header).toBe("# Header\n");
      expect(result.blocks).toHaveLength(2);
      expect(result.blocks[0]?.id).toBe("INSTALLATION");
      expect(result.blocks[0]?.content).toBe(
        "## Installation\nRun npm install\n"
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

  //   describe.skip("fern-tag variable replacement", () => {
  //     it("should replace fern-tag with variable value", () => {
  //       const content =
  //         "## Installation\nnpm install my-package <!-- fern-tag: package-name -->";
  //       const variables = new Map([["package-name", "awesome-package"]]);
  //       const result = parser.parse({ content, variables });

  //       expect(result.blocks[0]?.content).toBe(
  //         "## Installation\nawesome-package<!-- fern-tag: package-name -->\n"
  //       );
  //     });

  //     it("should handle multiple fern-tags in different blocks", () => {
  //       const content =
  //         "## Installation\nnpm install <!-- fern-tag: package -->\n## Usage\nimport { <!-- fern-tag: export --> } from 'lib'";
  //       const variables = new Map([
  //         ["package", "my-lib"],
  //         ["export", "MyClass"],
  //       ]);
  //       const result = parser.parse({ content, variables });

  //       expect(result.blocks[0]?.content).toBe(
  //         "## Installation\nmy-lib<!-- fern-tag: package -->\n"
  //       );
  //       expect(result.blocks[1]?.content).toBe(
  //         "## Usage\nimport { MyClass<!-- fern-tag: export --> } from 'lib'\n"
  //       );
  //     });

  //     it("should leave line unchanged if variable not found", () => {
  //       const content = "## Installation\nnpm install <!-- fern-tag: missing -->";
  //       const variables = new Map([["other", "value"]]);
  //       const result = parser.parse({ content, variables });

  //       expect(result.blocks[0]?.content).toBe(
  //         "## Installation\nnpm install <!-- fern-tag: missing -->\n"
  //       );
  //     });

  //     it("should leave line unchanged if no fern-tag present", () => {
  //       const content = "## Installation\nnpm install my-package";
  //       const variables = new Map([["package", "other"]]);
  //       const result = parser.parse({ content, variables });

  //       expect(result.blocks[0]?.content).toBe(
  //         "## Installation\nnpm install my-package\n"
  //       );
  //     });

  //     it("should handle fern-tags with different whitespace", () => {
  //       const content =
  //         "## Test\nvalue<!--fern-tag:key-->\nvalue <!-- fern-tag: key2 -->\nvalue <!--  fern-tag:  key3  -->";
  //       const variables = new Map([
  //         ["key", "A"],
  //         ["key2", "B"],
  //         ["key3", "C"],
  //       ]);
  //       const result = parser.parse({ content, variables });

  //       expect(result.blocks[0]?.content).toBe(
  //         "## Test\nA<!--fern-tag:key-->\nB<!-- fern-tag: key2 -->\nC<!--  fern-tag:  key3  -->\n"
  //       );
  //     });

  //     it("should work with empty variables map", () => {
  //       const content = "## Installation\nnpm install <!-- fern-tag: package -->";
  //       const result = parser.parse({ content });

  //       expect(result.blocks[0]?.content).toBe(
  //         "## Installation\nnpm install <!-- fern-tag: package -->\n"
  //       );
  //     });

  //     it("should handle fern-tags in header section", () => {
  //       const content = "# Title <!-- fern-tag: title -->\nIntro text";
  //       const variables = new Map([["title", "My Awesome Project"]]);
  //       const result = parser.parse({ content, variables });

  //       expect(result.header).toBe(
  //         "# Title <!-- fern-tag: title -->\nIntro text"
  //       );
  //       expect(result.blocks).toHaveLength(0);
  //     });
  //   });
});
