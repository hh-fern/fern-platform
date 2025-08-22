import { DocumentChangeSetImpl } from "./DocumentChangeTracker";
import { BaseState, Change, DocumentChangeSet } from "./types";

/**
 * Storage interface for persisting document change sets
 */
export interface ChangeStorage {
  /**
   * Load a change set for a specific branch
   */
  load(branchId: string): Promise<DocumentChangeSet | null>;

  /**
   * Save a change set for a specific branch
   */
  save(branchId: string, changeSet: DocumentChangeSet): Promise<void>;

  /**
   * Clear all changes for a specific branch
   */
  clear(branchId: string): Promise<void>;

  /**
   * Get all branch IDs that have stored changes
   */
  getAllBranches(): Promise<string[]>;

  /**
   * Remove old/expired change sets
   */
  cleanup(maxAgeMs?: number): Promise<void>;
}

/**
 * Serializable format for storing change sets
 */
interface SerializedChangeSet {
  baseState: {
    files: [string, string][]; // [FilePath, FileContent]
    docsYml: string;
  };
  changes: Change[];
  version: number;
  timestamp: number;
}

/**
 * LocalStorage implementation of ChangeStorage
 */
export class LocalStorageChangeStorage implements ChangeStorage {
  private readonly storageKeyPrefix: string;
  private readonly currentVersion = 1;

  constructor(private readonly keyPrefix: string = "fern-document-changes") {
    this.storageKeyPrefix = keyPrefix;
  }

  private getStorageKey(branchId: string): string {
    return `${this.storageKeyPrefix}-${branchId}`;
  }

  async load(branchId: string): Promise<DocumentChangeSet | null> {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      const key = this.getStorageKey(branchId);
      console.log(`[DEBUG] Loading from localStorage with key: ${key}`);
      const stored = localStorage.getItem(key);

      if (!stored) {
        console.log(`[DEBUG] No data found in localStorage for key: ${key}`);
        return null;
      }

      console.log(`[DEBUG] Found stored data for ${key}, size:`, stored.length);
      const parsed = JSON.parse(stored) as SerializedChangeSet;

      // Version check for future migrations
      if (parsed.version !== this.currentVersion) {
        console.warn(
          `Change set version mismatch for branch ${branchId}. Expected ${this.currentVersion}, got ${parsed.version}`
        );
        // For now, return null to start fresh. In the future, we could add migration logic.
        return null;
      }

      console.log(`[DEBUG] Successfully parsed stored data for ${key}:`, {
        changesCount: parsed.changes.length,
        timestamp: new Date(parsed.timestamp).toISOString()
      });

      // Reconstruct the change set
      const baseState: BaseState = {
        files: new Map(parsed.baseState.files),
        docsYml: parsed.baseState.docsYml,
      };

      const reconstructed = new DocumentChangeSetImpl(baseState, parsed.changes);
      
      console.log(`[DEBUG] Reconstructed changeSet for ${key}:`, {
        changesCount: reconstructed.changes.length,
        hasChanges: reconstructed.hasChanges()
      });

      return reconstructed;
    } catch (error) {
      console.error(`Failed to load change set for branch ${branchId}:`, error);
      return null;
    }
  }

  async save(branchId: string, changeSet: DocumentChangeSet): Promise<void> {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const key = this.getStorageKey(branchId);

      const serialized: SerializedChangeSet = {
        baseState: {
          files: Array.from(changeSet.baseState.files.entries()),
          docsYml: changeSet.baseState.docsYml,
        },
        changes: changeSet.changes,
        version: this.currentVersion,
        timestamp: Date.now(),
      };

      console.log(`[DEBUG] Saving to localStorage with key: ${key}`, {
        changesCount: changeSet.changes.length,
        serializedSize: JSON.stringify(serialized).length
      });
      localStorage.setItem(key, JSON.stringify(serialized));
      
      // Verify save worked
      const verification = localStorage.getItem(key);
      console.log(`[DEBUG] Save verification for ${key}:`, verification ? 'SUCCESS' : 'FAILED');
    } catch (error) {
      console.error(`Failed to save change set for branch ${branchId}:`, error);
      throw error;
    }
  }

  async clear(branchId: string): Promise<void> {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const key = this.getStorageKey(branchId);
      localStorage.removeItem(key);
    } catch (error) {
      console.error(
        `Failed to clear change set for branch ${branchId}:`,
        error
      );
    }
  }

  async getAllBranches(): Promise<string[]> {
    if (typeof window === "undefined") {
      return [];
    }

    const branches: string[] = [];

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(`${this.storageKeyPrefix}-`)) {
          const branchId = key.replace(`${this.storageKeyPrefix}-`, "");
          branches.push(branchId);
        }
      }
    } catch (error) {
      console.error("Failed to get all branches:", error);
    }

    return branches;
  }

  async cleanup(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    if (typeof window === "undefined") {
      return;
    }

    const now = Date.now();
    const branches = await this.getAllBranches();

    for (const branchId of branches) {
      try {
        const key = this.getStorageKey(branchId);
        const stored = localStorage.getItem(key);

        if (stored) {
          const parsed = JSON.parse(stored) as SerializedChangeSet;

          if (parsed.timestamp && now - parsed.timestamp > maxAgeMs) {
            localStorage.removeItem(key);
            console.log(`Cleaned up old change set for branch: ${branchId}`);
          }
        }
      } catch (error) {
        console.error(`Failed to cleanup branch ${branchId}:`, error);
        // Continue with other branches
      }
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalBranches: number;
    totalSizeBytes: number;
    oldestTimestamp?: number;
    newestTimestamp?: number;
  }> {
    if (typeof window === "undefined") {
      return { totalBranches: 0, totalSizeBytes: 0 };
    }

    const branches = await this.getAllBranches();
    let totalSizeBytes = 0;
    let oldestTimestamp: number | undefined;
    let newestTimestamp: number | undefined;

    for (const branchId of branches) {
      try {
        const key = this.getStorageKey(branchId);
        const stored = localStorage.getItem(key);

        if (stored) {
          totalSizeBytes += stored.length * 2; // Rough estimate (UTF-16)

          const parsed = JSON.parse(stored) as SerializedChangeSet;
          if (parsed.timestamp) {
            if (!oldestTimestamp || parsed.timestamp < oldestTimestamp) {
              oldestTimestamp = parsed.timestamp;
            }
            if (!newestTimestamp || parsed.timestamp > newestTimestamp) {
              newestTimestamp = parsed.timestamp;
            }
          }
        }
      } catch (error) {
        console.error(`Failed to analyze branch ${branchId}:`, error);
      }
    }

    return {
      totalBranches: branches.length,
      totalSizeBytes,
      oldestTimestamp,
      newestTimestamp,
    };
  }
}

/**
 * In-memory implementation for testing
 */
export class InMemoryChangeStorage implements ChangeStorage {
  private storage = new Map<string, DocumentChangeSet>();

  async load(branchId: string): Promise<DocumentChangeSet | null> {
    return this.storage.get(branchId) || null;
  }

  async save(branchId: string, changeSet: DocumentChangeSet): Promise<void> {
    // Create a deep copy to avoid mutations affecting stored data
    const baseState: BaseState = {
      files: new Map(changeSet.baseState.files),
      docsYml: changeSet.baseState.docsYml,
    };

    const copiedChangeSet = new DocumentChangeSetImpl(baseState, [
      ...changeSet.changes,
    ]);

    this.storage.set(branchId, copiedChangeSet);
  }

  async clear(branchId: string): Promise<void> {
    this.storage.delete(branchId);
  }

  async getAllBranches(): Promise<string[]> {
    return Array.from(this.storage.keys());
  }

  async cleanup(_maxAgeMs?: number): Promise<void> {
    // In memory storage doesn't need cleanup
  }

  /**
   * Testing helper to clear all data
   */
  clearAll(): void {
    this.storage.clear();
  }
}

/**
 * Factory function for creating storage instances
 */
export function createChangeStorage(
  type: "localStorage" | "memory" = "localStorage"
): ChangeStorage {
  switch (type) {
    case "localStorage":
      return new LocalStorageChangeStorage();
    case "memory":
      return new InMemoryChangeStorage();
    default:
      throw new Error(`Unknown storage type: ${type}`);
  }
}
