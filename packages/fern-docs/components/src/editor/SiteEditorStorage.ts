import {
  SiteEditorPageStore,
  SiteEditorRootStore,
  SiteEditorYmlConfigStore,
} from "./types";

const STORAGE_KEY = "site-editor:";
const PAGE_KEY = "page:";
const YML_CONFIG_KEY = "yml-config:";

// TODO: add Zod validation to all get/set methods
export class SiteEditorStorage {
  private _storage: Storage;
  private _pageKey: string;
  private _ymlConfigKey: string;

  constructor(
    storage: Storage,
    pageKey = PAGE_KEY,
    ymlConfigKey = YML_CONFIG_KEY
  ) {
    this._storage = storage;
    this._pageKey = pageKey;
    this._ymlConfigKey = ymlConfigKey;
  }

  getPage(pagePath: string): SiteEditorPageStore | null {
    const page = this._storage.get(this._pageKey + pagePath);
    return page ? JSON.parse(page) : null;
  }

  setPage(page: SiteEditorPageStore): void {
    this._storage.set(this._pageKey + page.path, JSON.stringify(page));
  }

  removePage(pagePath: string): void {
    this._storage.remove(this._pageKey + pagePath);
  }

  getYmlConfig(configPath: string): SiteEditorYmlConfigStore | null {
    const ymlConfig = this._storage.get(this._ymlConfigKey + configPath);
    return ymlConfig ? JSON.parse(ymlConfig) : null;
  }

  setYmlConfig(config: SiteEditorYmlConfigStore): void {
    this._storage.set(this._ymlConfigKey, JSON.stringify(config));
  }

  removeYmlConfig(): void {
    this._storage.remove(this._ymlConfigKey);
  }

  getRoot(): SiteEditorRootStore | null {
    const configPath: SiteEditorRootStore["path"] = "fern/docs.yml";
    return this.getYmlConfig(configPath) as SiteEditorRootStore | null;
  }

  setRoot(root: SiteEditorRootStore): void {
    this.setYmlConfig(root);
  }

  removeRoot(): void {
    this.removeYmlConfig();
  }
}

export function createSiteEditorLocalStorage(): SiteEditorStorage {
  return new SiteEditorStorage(new LocalStorage());
}

export function createSiteEditorMemoryStorage(): SiteEditorStorage {
  return new SiteEditorStorage(new MapStorage());
}

interface Storage {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
  clear(): void;
}

class LocalStorage implements Storage {
  private _storageKey: string;

  constructor(storageKey = STORAGE_KEY) {
    this._storageKey = storageKey;
  }

  get(key: string): string | null {
    try {
      return localStorage.getItem(this._storageKey + key);
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  set(key: string, value: string): void {
    try {
      localStorage.setItem(this._storageKey + key, value);
    } catch (error) {
      console.error(error);
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(this._storageKey + key);
    } catch (error) {
      console.error(error);
    }
  }

  clear(): void {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this._storageKey)) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error(error);
    }
  }
}

class MapStorage implements Storage {
  private _map = new Map<string, string>();

  get(key: string): string | null {
    return this._map.get(key) ?? null;
  }

  set(key: string, value: string): void {
    this._map.set(key, value);
  }

  remove(key: string): void {
    this._map.delete(key);
  }

  clear(): void {
    this._map.clear();
  }
}
