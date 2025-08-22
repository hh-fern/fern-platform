import { beforeEach, describe, expect, it } from "vitest";

import {
  DocumentChangeSetImpl,
  DocumentChangeTracker,
} from "../DocumentChangeTracker";
import { BaseState } from "../types";

describe("DocumentChangeTracker", () => {
  let tracker: DocumentChangeTracker;
  let baseState: BaseState;

  beforeEach(() => {
    tracker = new DocumentChangeTracker();
    baseState = {
      files: new Map([
        ["existing-file.mdx", "# Existing File\nContent here"],
        ["another-file.mdx", "# Another File\nMore content"],
      ]),
      docsYml:
        "navigation:\n  - page: existing-file.mdx\n  - page: another-file.mdx",
    };
  });

  describe("createChangeSet", () => {
    it("should create empty change set with base state", () => {
      const changeSet = tracker.createChangeSet(baseState);

      expect(changeSet.hasChanges()).toBe(false);
      expect(changeSet.changes).toHaveLength(0);
      expect(changeSet.baseState).toBe(baseState);
    });
  });

  describe("file operations", () => {
    it("should handle file creation", () => {
      const changeSet = tracker.createChangeSet(baseState);
      const updated = changeSet.addChange({
        type: "file:create",
        path: "new-file.mdx",
        content: "# New File\nNew content",
        section: "Getting Started",
      });

      expect(updated.hasChanges()).toBe(true);
      expect(updated.changes).toHaveLength(1);
      expect(updated.changes[0]?.type).toBe("file:create");
      expect(updated.getFileContent("new-file.mdx")).toBe(
        "# New File\nNew content"
      );
    });

    it("should handle file updates", () => {
      const changeSet = tracker.createChangeSet(baseState);
      const updated = changeSet.addChange({
        type: "file:update",
        path: "existing-file.mdx",
        content: "# Updated File\nUpdated content",
      });

      expect(updated.hasChanges()).toBe(true);
      expect(updated.getFileContent("existing-file.mdx")).toBe(
        "# Updated File\nUpdated content"
      );

      const commitPlan = updated.getCommitPlan();
      expect(commitPlan.hasChanges).toBe(true);
      expect(commitPlan.filesToCommit.get("existing-file.mdx")).toBe(
        "# Updated File\nUpdated content"
      );
    });

    it("should handle file deletion", () => {
      const changeSet = tracker.createChangeSet(baseState);
      const updated = changeSet.addChange({
        type: "file:delete",
        path: "existing-file.mdx",
      });

      expect(updated.hasChanges()).toBe(true);
      expect(updated.getFileContent("existing-file.mdx")).toBeUndefined();

      const commitPlan = updated.getCommitPlan();
      expect(commitPlan.hasChanges).toBe(true);
      expect(commitPlan.filesToDelete).toContain("existing-file.mdx");
    });
  });

  describe("change compaction", () => {
    it("should compact create followed by delete to no net change", () => {
      const changeSet = tracker.createChangeSet(baseState);

      const withCreate = changeSet.addChange({
        type: "file:create",
        path: "temp-file.mdx",
        content: "# Temp File",
      });

      const withDelete = withCreate.addChange({
        type: "file:delete",
        path: "temp-file.mdx",
      });

      const compacted = tracker.compactChanges(withDelete);

      expect(compacted.getFileContent("temp-file.mdx")).toBeUndefined();
      expect(compacted.getCommitPlan().hasChanges).toBe(false);
    });

    it("should compact multiple updates to single update", () => {
      const changeSet = tracker.createChangeSet(baseState);

      let updated = changeSet.addChange({
        type: "file:update",
        path: "existing-file.mdx",
        content: "# Update 1",
      });

      updated = updated.addChange({
        type: "file:update",
        path: "existing-file.mdx",
        content: "# Update 2",
      });

      updated = updated.addChange({
        type: "file:update",
        path: "existing-file.mdx",
        content: "# Final Update",
      });

      const compacted = tracker.compactChanges(updated);

      expect(compacted.getFileContent("existing-file.mdx")).toBe(
        "# Final Update"
      );
      expect(compacted.getChangesForFile("existing-file.mdx")).toHaveLength(1);
    });

    it("should compact create followed by update to single create", () => {
      const changeSet = tracker.createChangeSet(baseState);

      let updated = changeSet.addChange({
        type: "file:create",
        path: "new-file.mdx",
        content: "# Initial Content",
      });

      updated = updated.addChange({
        type: "file:update",
        path: "new-file.mdx",
        content: "# Updated Content",
      });

      const compacted = tracker.compactChanges(updated);

      expect(compacted.getFileContent("new-file.mdx")).toBe(
        "# Updated Content"
      );
      const fileChanges = compacted.getChangesForFile("new-file.mdx");
      expect(fileChanges).toHaveLength(1);
      expect(fileChanges[0]?.type).toBe("file:create");
    });
  });

  describe("commit planning", () => {
    it("should generate correct commit plan for mixed changes", () => {
      let changeSet = tracker.createChangeSet(baseState);

      // Create new file
      changeSet = changeSet.addChange({
        type: "file:create",
        path: "new-file.mdx",
        content: "# New File",
      });

      // Update existing file
      changeSet = changeSet.addChange({
        type: "file:update",
        path: "existing-file.mdx",
        content: "# Updated Existing",
      });

      // Delete another file
      changeSet = changeSet.addChange({
        type: "file:delete",
        path: "another-file.mdx",
      });

      const commitPlan = changeSet.getCommitPlan();

      expect(commitPlan.hasChanges).toBe(true);
      expect(commitPlan.filesToCommit.size).toBe(2);
      expect(commitPlan.filesToCommit.get("new-file.mdx")).toBe("# New File");
      expect(commitPlan.filesToCommit.get("existing-file.mdx")).toBe(
        "# Updated Existing"
      );
      expect(commitPlan.filesToDelete).toEqual(["another-file.mdx"]);
    });

    it("should handle no changes correctly", () => {
      const changeSet = tracker.createChangeSet(baseState);
      const commitPlan = changeSet.getCommitPlan();

      expect(commitPlan.hasChanges).toBe(false);
      expect(commitPlan.filesToCommit.size).toBe(0);
      expect(commitPlan.filesToDelete).toHaveLength(0);
    });
  });

  describe("change removal", () => {
    it("should remove specific changes by ID", () => {
      let changeSet = tracker.createChangeSet(baseState);

      changeSet = changeSet.addChange({
        type: "file:create",
        path: "file1.mdx",
        content: "# File 1",
      });

      changeSet = changeSet.addChange({
        type: "file:create",
        path: "file2.mdx",
        content: "# File 2",
      });

      const changeToRemove = changeSet.changes[0];
      expect(changeToRemove).toBeDefined();
      if (changeToRemove) {
        const updated = changeSet.removeChange(changeToRemove.id);

        expect(updated.changes).toHaveLength(1);
        expect(updated.changes[0]?.id).not.toBe(changeToRemove.id);
        expect(updated.getFileContent("file1.mdx")).toBeUndefined();
        expect(updated.getFileContent("file2.mdx")).toBe("# File 2");
      }
    });
  });

  describe("validation", () => {
    it("should validate consistent change sets", () => {
      const changeSet = tracker.createChangeSet(baseState);
      const updated = changeSet.addChange({
        type: "file:create",
        path: "new-file.mdx",
        content: "# New File",
      });

      const validation = tracker.validateChangeSet(updated);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("should detect duplicate change IDs", () => {
      const changeSet = tracker.createChangeSet(baseState);
      const change1 = changeSet.addChange({
        type: "file:create",
        path: "file1.mdx",
        content: "# File 1",
      });

      // Manually create invalid state with duplicate ID
      const firstChange = change1.changes[0];
      expect(firstChange).toBeDefined();
      if (firstChange) {
        const duplicateChange = { ...firstChange, path: "file2.mdx" };
        const invalidChangeSet = new DocumentChangeSetImpl(baseState, [
          firstChange,
          duplicateChange,
        ]);

        const validation = tracker.validateChangeSet(invalidChangeSet);

        expect(validation.valid).toBe(false);
        expect(
          validation.errors.some((e) => e.includes("Duplicate change ID"))
        ).toBe(true);
      }
    });
  });

  describe("docs.yml operations", () => {
    it("should track docs.yml add page changes", () => {
      const changeSet = tracker.createChangeSet(baseState);
      const updated = changeSet.addChange({
        type: "docs.yml:add-page",
        pagePath: "new-page.mdx",
        section: "API Reference",
      });

      expect(updated.hasChanges()).toBe(true);
      expect(updated.changes[0]?.type).toBe("docs.yml:add-page");
    });

    it("should track docs.yml remove page changes", () => {
      const changeSet = tracker.createChangeSet(baseState);
      const updated = changeSet.addChange({
        type: "docs.yml:remove-page",
        pagePath: "existing-page.mdx",
      });

      expect(updated.hasChanges()).toBe(true);
      expect(updated.changes[0]?.type).toBe("docs.yml:remove-page");
    });
  });

  describe("change history queries", () => {
    it("should return changes for specific files", () => {
      let changeSet = tracker.createChangeSet(baseState);

      changeSet = changeSet.addChange({
        type: "file:create",
        path: "file1.mdx",
        content: "# File 1",
      });

      changeSet = changeSet.addChange({
        type: "file:update",
        path: "file1.mdx",
        content: "# Updated File 1",
      });

      changeSet = changeSet.addChange({
        type: "file:create",
        path: "file2.mdx",
        content: "# File 2",
      });

      const file1Changes = changeSet.getChangesForFile("file1.mdx");
      expect(file1Changes).toHaveLength(2);
      expect(file1Changes[0]?.type).toBe("file:create");
      expect(file1Changes[1]?.type).toBe("file:update");

      const file2Changes = changeSet.getChangesForFile("file2.mdx");
      expect(file2Changes).toHaveLength(1);
      expect(file2Changes[0]?.type).toBe("file:create");
    });
  });

  describe("complex scenarios", () => {
    it("should handle create -> update -> delete -> create sequence", () => {
      let changeSet = tracker.createChangeSet(baseState);

      // Create file
      changeSet = changeSet.addChange({
        type: "file:create",
        path: "complex-file.mdx",
        content: "# Initial Content",
      });

      // Update file
      changeSet = changeSet.addChange({
        type: "file:update",
        path: "complex-file.mdx",
        content: "# Updated Content",
      });

      // Delete file
      changeSet = changeSet.addChange({
        type: "file:delete",
        path: "complex-file.mdx",
      });

      // Create file again with different content
      changeSet = changeSet.addChange({
        type: "file:create",
        path: "complex-file.mdx",
        content: "# Recreated Content",
      });

      expect(changeSet.getFileContent("complex-file.mdx")).toBe(
        "# Recreated Content"
      );

      const commitPlan = changeSet.getCommitPlan();
      expect(commitPlan.filesToCommit.get("complex-file.mdx")).toBe(
        "# Recreated Content"
      );
    });
  });
});
