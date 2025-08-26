import { SiteEditorStorage } from "./SiteEditorStorage";
import {
  SiteEditorContentStore,
  SiteEditorPageChange,
  SiteEditorPageChanges,
  SiteEditorRootStore,
  SiteEditorSectionStore,
  isSectionStore,
} from "./types";

// TODO: make extending docs.yml serializer as straightforward as possible, possibly with a plugin system or as a separate class

type SiteEditorStoreListener = () => void;

export interface SiteEditorStoreSnapshot {
  root: SiteEditorRootStore;
}

// Goal: keep server unaware of HTML representations, only MDX
// SiteEditorStore is responsible for transforming MDX (from server) to HTML and back to MDX (for committing to GitHub)
export class SiteEditorStore {
  private _storage: SiteEditorStorage;
  private _listeners = new Set<SiteEditorStoreListener>();
  private _latestPageChanges: SiteEditorPageChanges = {};
  // private _latestYmlConfigChanges: SiteEditorYmlConfigChanges = {};

  constructor(storage: SiteEditorStorage) {
    this._storage = storage;
  }

  /**
   * addChange guarantees that every changed file is represented in _latestChanges.
   */
  addChange(change: SiteEditorPageChange): void {
    switch (change.type) {
      case "page:create":
        if (this._storage.getPage(change.payload.page.path)) {
          throw new Error(
            `[${change.type}] Page already exists at path: ${change.payload.page.path}`
          );
        }
        // Create page at page.path
        this._storage.setPage(change.payload.page);
        this._latestPageChanges[change.payload.page.path] = change;
        break;
      case "page:update":
        if (!this._storage.getPage(change.payload.page.path)) {
          throw new Error(
            `[${change.type}] Page does not exist at path: ${change.payload.page.path}`
          );
        }
        // Overwrite page at page.path
        this._storage.setPage(change.payload.page);
        this._latestPageChanges[change.payload.page.path] = change;
        break;
      case "page:delete":
        if (!this._storage.getPage(change.payload.pagePath)) {
          throw new Error(
            `[${change.type}] Page does not exist at path: ${change.payload.pagePath}`
          );
        }
        // Delete page at pagePath
        this._storage.removePage(change.payload.pagePath);
        this._latestPageChanges[change.payload.pagePath] = change;

        break;
      default:
        throw new Error(`Unknown change type: ${(change as any).type}`);
    }
    const currentRoot = this._storage.getRoot() ?? {
      type: "root",
      path: "fern/docs.yml",
      navigation: {
        type: "navigation",
        contents: [],
      },
    };
    this._storage.setRoot(
      computeNextRoot(currentRoot, this._latestPageChanges)
    );
    this._notifyListeners();
  }

  /**
   * @see {@link https://react.dev/reference/react/useSyncExternalStore}
   */
  subscribe = (listener: SiteEditorStoreListener): (() => void) => {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  };

  /**
   * @see {@link https://react.dev/reference/react/useSyncExternalStore}
   */
  getSnapshot = (): SiteEditorStoreSnapshot | null => {
    const root = this._storage.getRoot();
    return root ? { root } : null;
  };

  private _notifyListeners(): void {
    this._listeners.forEach((listener) => listener());
  }
}

function rootWithNavigation(root: SiteEditorRootStore): SiteEditorRootStore {
  return {
    ...root,
    navigation: root.navigation ?? {
      type: "navigation",
      contents: [],
    },
  };
}

function findSectionByName(
  contents: SiteEditorContentStore[],
  sectionName: string
): SiteEditorSectionStore | null {
  for (const content of contents) {
    if (isSectionStore(content) && content.name === sectionName) {
      return content;
    }
  }
  return null;
}

function computeNextRoot(
  root: SiteEditorRootStore,
  latestPageChanges: SiteEditorPageChanges
): SiteEditorRootStore {
  const nextRoot = rootWithNavigation(root);
  const navigation = nextRoot.navigation;
  
  if (!navigation) {
    return nextRoot;
  }

  for (const change of Object.values(latestPageChanges)) {
    switch (change.type) {
      case "page:create": {
        const { page, sectionName, sectionIndex } = change.payload;

        let targetSectionIndex = 0;

        if (sectionName !== undefined) {
          const section = findSectionByName(navigation.contents, sectionName);
          if (section) {
            targetSectionIndex = navigation.contents.indexOf(section);
          }
        }

        if (
          sectionIndex !== undefined &&
          sectionIndex >= 0 &&
          sectionIndex < navigation.contents.length
        ) {
          targetSectionIndex = sectionIndex;
        }

        if (targetSectionIndex >= navigation.contents.length) {
          navigation.contents.push({
            type: "section",
            name: sectionName || "",
            contents: [page],
          });
        } else {
          const targetContent = navigation.contents[targetSectionIndex];
          if (targetContent && targetContent.type === "section") {
            navigation.contents[targetSectionIndex] = {
              ...targetContent,
              contents: [...targetContent.contents, page],
            };
          }
        }

        break;
      }
      case "page:update":
        // Page updates don't affect navigation, so we don't need to do anything here
        break;
      case "page:delete": {
        const { pagePath } = change.payload;

        for (let i = 0; i < navigation.contents.length; i++) {
          const content = navigation.contents[i];
          if (!content) continue;

          if (content.type === "section") {
            const pageIndex = content.contents.findIndex(
              (item: SiteEditorContentStore) => item.type === "page" && item.path === pagePath
            );

            if (pageIndex !== -1) {
              navigation.contents[i] = {
                ...content,
                contents: content.contents.filter(
                  (item: SiteEditorContentStore) => !(item.type === "page" && item.path === pagePath)
                ),
              };
              break;
            }
          } else if (content.type === "page" && content.path === pagePath) {
            navigation.contents = navigation.contents.filter((_: SiteEditorContentStore, idx: number) => idx !== i);
            break;
          }
        }
        break;
      }
    }
  }

  return nextRoot;
}

