import { beforeEach, describe, expect, it } from "vitest";

import { DocumentChangeTracker } from "../DocumentChangeTracker";
import { InMemoryChangeStorage, LocalStorageChangeStorage } from "../storage";
import { BaseState } from "../types";

describe("ChangeStorage", () => {
  let tracker: DocumentChangeTracker;
  let baseState: BaseState;

  beforeEach(() => {
    tracker = new DocumentChangeTracker();
    baseState = {
      files: new Map([
        ["file1.mdx", "# File 1"],
        ["file2.mdx", "# File 2"],
      ]),
      docsYml: "navigation:\n  - page: file1.mdx",
    };
  });

  describe("InMemoryChangeStorage", () => {
    let storage: InMemoryChangeStorage;

    beforeEach(() => {
      storage = new InMemoryChangeStorage();
    });

    it("should save and load change sets", async () => {
      const changeSet = tracker.createChangeSet(baseState);
      const updated = changeSet.addChange({
        type: "file:create",
        path: "new-file.mdx",
        content: "# New File",
      });

      await storage.save("test-branch", updated);
      const loaded = await storage.load("test-branch");

      expect(loaded).not.toBeNull();
      if (loaded) {
        expect(loaded.hasChanges()).toBe(true);
        expect(loaded.changes).toHaveLength(1);
        expect(loaded.getFileContent("new-file.mdx")).toBe("# New File");
      }
    });

    it("should return null for non-existent branches", async () => {
      const loaded = await storage.load("non-existent");
      expect(loaded).toBeNull();
    });

    it("should clear change sets", async () => {
      const changeSet = tracker.createChangeSet(baseState);
      const updated = changeSet.addChange({
        type: "file:create",
        path: "temp-file.mdx",
        content: "# Temp",
      });

      await storage.save("temp-branch", updated);
      await storage.clear("temp-branch");

      const loaded = await storage.load("temp-branch");
      expect(loaded).toBeNull();
    });

    it("should list all branches", async () => {
      const changeSet1 = tracker.createChangeSet(baseState).addChange({
        type: "file:create",
        path: "file1.mdx",
        content: "# File 1",
      });

      const changeSet2 = tracker.createChangeSet(baseState).addChange({
        type: "file:create",
        path: "file2.mdx",
        content: "# File 2",
      });

      await storage.save("branch-1", changeSet1);
      await storage.save("branch-2", changeSet2);

      const branches = await storage.getAllBranches();
      expect(branches.sort()).toEqual(["branch-1", "branch-2"]);
    });

    it("should handle complex change sets with all operation types", async () => {
      let changeSet = tracker.createChangeSet(baseState);

      changeSet = changeSet.addChange({
        type: "file:create",
        path: "new-file.mdx",
        content: "# New File",
      });

      changeSet = changeSet.addChange({
        type: "file:update",
        path: "file1.mdx",
        content: "# Updated File 1",
      });

      changeSet = changeSet.addChange({
        type: "file:delete",
        path: "file2.mdx",
      });

      changeSet = changeSet.addChange({
        type: "docs.yml:add-page",
        pagePath: "new-page.mdx",
        section: "API",
      });

      await storage.save("complex-branch", changeSet);
      const loaded = await storage.load("complex-branch");

      expect(loaded).not.toBeNull();
      if (loaded) {
        expect(loaded.changes).toHaveLength(4);
        expect(loaded.getFileContent("new-file.mdx")).toBe("# New File");
        expect(loaded.getFileContent("file1.mdx")).toBe("# Updated File 1");
        expect(loaded.getFileContent("file2.mdx")).toBeUndefined();
      }
    });
  });

  // Note: LocalStorage tests would need a more complex setup to mock localStorage
  // For now, we'll focus on the business logic tests
  describe("LocalStorageChangeStorage", () => {
    it("should handle browser environment check", () => {
      const storage = new LocalStorageChangeStorage();
      expect(storage).toBeDefined();
    });

    // Additional localStorage-specific tests would require mocking window.localStorage
    // which is beyond the scope of this initial implementation
  });

  describe("Storage consistency", () => {
    it("should maintain change IDs and timestamps across save/load", async () => {
      const storage = new InMemoryChangeStorage();
      const changeSet = tracker.createChangeSet(baseState);

      const updated = changeSet.addChange({
        type: "file:create",
        path: "test-file.mdx",
        content: "# Test File",
      });

      const originalChange = updated.changes[0];
      expect(originalChange).toBeDefined();

      await storage.save("test-branch", updated);
      const loaded = await storage.load("test-branch");

      expect(loaded).not.toBeNull();
      if (loaded) {
        expect(loaded.changes).toHaveLength(1);

        const loadedChange = loaded.changes[0];
        expect(loadedChange).toBeDefined();
        if (loadedChange && originalChange) {
          expect(loadedChange.id).toBe(originalChange.id);
          expect(loadedChange.timestamp).toBe(originalChange.timestamp);
          expect(loadedChange.type).toBe(originalChange.type);
        }
      }
    });

    it("should preserve base state across save/load", async () => {
      const storage = new InMemoryChangeStorage();
      const changeSet = tracker.createChangeSet(baseState);

      await storage.save("test-branch", changeSet);
      const loaded = await storage.load("test-branch");

      expect(loaded).not.toBeNull();
      if (loaded) {
        expect(loaded.baseState.docsYml).toBe(baseState.docsYml);
        expect(loaded.baseState.files.size).toBe(baseState.files.size);
        expect(loaded.baseState.files.get("file1.mdx")).toBe("# File 1");
        expect(loaded.baseState.files.get("file2.mdx")).toBe("# File 2");
      }
    });
  });

  describe("Error handling", () => {
    it("should handle storage errors gracefully", async () => {
      const storage = new InMemoryChangeStorage();

      // This shouldn't throw
      await storage.clear("non-existent-branch");
      await storage.cleanup();

      const branches = await storage.getAllBranches();
      expect(Array.isArray(branches)).toBe(true);
    });
  });
});
