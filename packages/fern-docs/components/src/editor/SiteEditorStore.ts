import { SiteEditorStorage } from "./SiteEditorStorage";

// TODO: make extending docs.yml serializer as straightforward as possible, possibly with a plugin system or as a separate class

type EditorStoreListener = () => void;
type EditorStoreChanges = Record<string, string>;

// Goal: keep server unaware of HTML representations, only MDX
// SiteEditorStore is responsible for transforming MDX (from server) to HTML and back to MDX (for committing to GitHub)
export class SiteEditorStore {
  private storage: SiteEditorStorage;
  private listeners = new Set<EditorStoreListener>();
  private changes: EditorStoreChanges = {};
  private isLoaded = false;

  constructor(storage: SiteEditorStorage) {
    this.storage = storage;
    void this.loadChanges();
  }

  private async loadChanges(): Promise<void> {
    try {
      const keys = await this.storage.keys();
      const changes: EditorStoreChanges = {};

      for (const key of keys) {
        const value = await this.storage.get(key);
        if (value != null) {
          changes[key] = value;
        }
      }

      this.changes = changes;
      this.isLoaded = true;
      this.notifyListeners();
    } catch (error) {
      console.error("Failed to load changes from storage:", error);
      this.isLoaded = true;
      this.notifyListeners();
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): EditorStoreChanges => {
    return this.changes;
  };

  getServerSnapshot = (): EditorStoreChanges => {
    return {};
  };

  isReady(): boolean {
    return this.isLoaded;
  }

  getChange(key: string): string | null {
    return this.changes[key] ?? null;
  }

  async setChange(key: string, value: string): Promise<void> {
    try {
      await this.storage.set(key, value);
      this.changes = { ...this.changes, [key]: value };
      this.notifyListeners();
    } catch (error) {
      console.error("Failed to set change:", error);
      throw error;
    }
  }

  async removeChange(key: string): Promise<void> {
    try {
      await this.storage.remove(key);
      const { [key]: removed, ...rest } = this.changes;
      this.changes = rest;
      this.notifyListeners();
    } catch (error) {
      console.error("Failed to remove change:", error);
      throw error;
    }
  }

  async clearAllChanges(): Promise<void> {
    try {
      await this.storage.clear();
      this.changes = {};
      this.notifyListeners();
    } catch (error) {
      console.error("Failed to clear changes:", error);
      throw error;
    }
  }

  hasChanges(): boolean {
    return Object.keys(this.changes).length > 0;
  }
}
