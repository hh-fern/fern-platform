type SiteEditorFilePath = string;

export type SiteEditorYmlConfigStoreType = "root" | "version" | "product";

interface SiteEditorYmlConfigStoreBase {
  /**
   * The type of config (e.g., "root", "version", "product").
   */
  type: SiteEditorYmlConfigStoreType;
  path: SiteEditorFilePath;
  navigation?: SiteEditorNavigationStore;
}

export interface SiteEditorRootStore extends SiteEditorYmlConfigStoreBase {
  type: "root";
  path: "fern/docs.yml";
  versions?: SiteEditorVersionStore[];
  products?: SiteEditorProductStore[];
}

export interface SiteEditorVersionStore extends SiteEditorYmlConfigStoreBase {
  type: "version";
  // TODO: ...
}

export interface SiteEditorProductStore extends SiteEditorYmlConfigStoreBase {
  type: "product";
  // TODO: ...
}

export type SiteEditorYmlConfigStore =
  | SiteEditorRootStore
  | SiteEditorVersionStore
  | SiteEditorProductStore;

export type SiteEditorNavigationStoreType = "navigation";

export interface SiteEditorNavigationStore {
  type: SiteEditorNavigationStoreType;
  contents: SiteEditorContentStore[];
}

export type SiteEditorContentStoreType = "section" | "page";

interface SiteEditorContentStoreBase {
  /**
   * The type of content (e.g., "section", "page").
   */
  type: SiteEditorContentStoreType;
}

export interface SiteEditorSectionStore extends SiteEditorContentStoreBase {
  type: "section";
  name: string;
  contents: SiteEditorContentStore[];
  overview?: SiteEditorPageStore;
}

export function isSectionStore(
  content: SiteEditorContentStore
): content is SiteEditorSectionStore {
  return content.type === "section";
}

export interface SiteEditorPageStore extends SiteEditorContentStoreBase {
  type: "page";
  name: string;
  path: SiteEditorFilePath;
  mdx: string;
}

export function isPageStore(
  content: SiteEditorContentStore
): content is SiteEditorPageStore {
  return content.type === "page";
}

export type SiteEditorContentStore =
  | SiteEditorSectionStore
  | SiteEditorPageStore;

export type SiteEditorStoreNodeType =
  | SiteEditorYmlConfigStoreType
  | SiteEditorNavigationStoreType
  | SiteEditorContentStoreType;

export type SiteEditorStoreNode =
  | SiteEditorYmlConfigStore
  | SiteEditorNavigationStore
  | SiteEditorContentStore;

export type SiteEditorPageChangeType =
  | "page:create"
  | "page:update"
  | "page:delete";

interface SiteEditorPageChangeBase {
  /**
   * The type of change (e.g., "page:create", "page:update", "page:delete").
   */
  type: SiteEditorPageChangeType;
}

export interface SiteEditorPageCreate extends SiteEditorPageChangeBase {
  type: "page:create";
  payload: {
    page: SiteEditorPageStore;
    sectionName?: string;
    sectionIndex?: number;
  };
}

export interface SiteEditorPageUpdate extends SiteEditorPageChangeBase {
  type: "page:update";
  payload: {
    page: SiteEditorPageStore;
  };
}

export interface SiteEditorPageDelete extends SiteEditorPageChangeBase {
  type: "page:delete";
  payload: {
    pagePath: SiteEditorFilePath;
  };
}

export type SiteEditorPageChange =
  | SiteEditorPageCreate
  | SiteEditorPageUpdate
  | SiteEditorPageDelete;

export type SiteEditorPageChanges = Record<
  SiteEditorFilePath,
  SiteEditorPageChange
>;

export type SiteEditorYmlConfigChangeType = "root:update";

interface SiteEditorYmlConfigChangeBase {
  type: SiteEditorYmlConfigChangeType;
}

export interface SiteEditorRootUpdate extends SiteEditorYmlConfigChangeBase {
  type: "root:update";
  payload: {
    root: SiteEditorRootStore;
  };
}

export type SiteEditorYmlConfigChange = SiteEditorRootUpdate;

export type SiteEditorYmlConfigChanges = Record<
  SiteEditorFilePath,
  SiteEditorYmlConfigChange
>;

export interface SiteEditorCommitPlan {
  pageChanges?: SiteEditorPageChanges;
  ymlConfigChanges?: SiteEditorYmlConfigChanges;
}
