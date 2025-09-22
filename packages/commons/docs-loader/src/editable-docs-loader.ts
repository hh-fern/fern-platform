import type { AuthEdgeConfig } from "@fern-api/docs-auth";
import type {
  AuthState,
  DynamicIRsByLanguage,
  FernFonts,
} from "@fern-api/docs-server";
import type { DocsLoader } from "@fern-api/docs-server/docs-loader";
import type { DocsMetadata } from "@fern-api/docs-server/docs-loader";
import type { HttpMethod } from "@fern-api/docs-utils";
import type { EdgeFlags, FernColorTheme } from "@fern-api/docs-utils";
import type { FileData } from "@fern-api/docs-utils/types/file-data";
import type { FernLayoutConfig } from "@fern-api/docs-utils/types/layout-config";
import type { DocsV1Read } from "@fern-api/fdr-sdk";
import type { ApiDefinition, FernNavigation } from "@fern-api/fdr-sdk";
import type {
  AuthScheme,
  EndpointId,
  ObjectProperty,
  PruningNodeType,
  TypeDefinition,
  TypeId,
} from "@fern-api/fdr-sdk/api-definition";
import type { Slug } from "@fern-api/fdr-sdk/navigation";

import {
  createCachedDocsLoader,
  encodeDocsLoaderDomain,
} from "./readonly-docs-loader";

/**
 * The EditableDocsLoader combines a read-only docs loader with a git loader.
 * The read-only docs loader is used to get docs metadata.
 * The git loader is used to get files from a remote git repository.
 */
class EditableDocsLoader implements DocsLoader {
  private readOnlyDocsLoader: DocsLoader;
  domain: string;
  fern_token: string | undefined;

  constructor(docsLoader: DocsLoader) {
    this.readOnlyDocsLoader = docsLoader;
    this.domain = docsLoader.domain;
    this.fern_token = docsLoader.fern_token;
  }

  getAuthConfig = (): Promise<AuthEdgeConfig | undefined> =>
    this.readOnlyDocsLoader.getAuthConfig();

  getMetadata = (): Promise<DocsMetadata> =>
    this.readOnlyDocsLoader.getMetadata();

  getFiles = (): Promise<Record<string, FileData>> =>
    this.readOnlyDocsLoader.getFiles();

  getMdxBundlerFiles = (): Promise<Record<string, string>> =>
    this.readOnlyDocsLoader.getMdxBundlerFiles();

  getPrunedApi = (
    id: string,
    ...nodes: PruningNodeType[]
  ): Promise<ApiDefinition.ApiDefinition> =>
    this.readOnlyDocsLoader.getPrunedApi(id, ...nodes);

  getEndpointById = (
    apiDefinitionId: string,
    endpointId: EndpointId
  ): Promise<{
    endpoint: ApiDefinition.EndpointDefinition;
    nodes: FernNavigation.EndpointNode[];
    globalHeaders: ObjectProperty[];
    authSchemes: AuthScheme[];
    types: Record<TypeId, TypeDefinition>;
  }> => this.readOnlyDocsLoader.getEndpointById(apiDefinitionId, endpointId);

  getEndpointByLocator = (
    method: HttpMethod,
    path: string,
    example?: string
  ): Promise<{
    apiDefinitionId: ApiDefinition.ApiDefinitionId;
    endpoint: ApiDefinition.EndpointDefinition;
    slugs: Slug[];
  }> => this.readOnlyDocsLoader.getEndpointByLocator(method, path, example);

  getRoot = (): Promise<FernNavigation.RootNode> =>
    this.readOnlyDocsLoader.getRoot();

  getNavigationNode = (id: string): Promise<FernNavigation.NavigationNode> =>
    this.readOnlyDocsLoader.getNavigationNode(id);

  unsafe_getFullRoot = (): Promise<FernNavigation.RootNode> =>
    this.readOnlyDocsLoader.unsafe_getFullRoot();

  getConfig = (): Promise<
    Omit<DocsV1Read.DocsDefinition["config"], "navigation" | "root">
  > => this.readOnlyDocsLoader.getConfig();

  async getPage(pageId: string): Promise<{
    filename: string;
    markdown: string;
    editThisPageUrl?: string;
    css?: any;
    rawMarkdown?: string;
  }> {
    return this.readOnlyDocsLoader.getPage(pageId);
  }

  getColors = (): Promise<{
    light?: FernColorTheme;
    dark?: FernColorTheme;
  }> => this.readOnlyDocsLoader.getColors();

  getFonts = (): Promise<FernFonts> => this.readOnlyDocsLoader.getFonts();

  getLayout = (): Promise<FernLayoutConfig> =>
    this.readOnlyDocsLoader.getLayout();

  getAuthState = (pathname?: string): Promise<AuthState> =>
    this.readOnlyDocsLoader.getAuthState(pathname);

  getEdgeFlags = (): Promise<EdgeFlags> =>
    this.readOnlyDocsLoader.getEdgeFlags();

  getBaseUrl = (): Promise<string> => this.readOnlyDocsLoader.getBaseUrl();

  getDynamicIr = (apiName: string): Promise<DynamicIRsByLanguage | undefined> =>
    this.readOnlyDocsLoader.getDynamicIr(apiName);
}

interface GetFernProjectSuccess {
  type: "ok";
  result: {
    defaultBranch: string;
    project: FernProject;
  };
}

type GetFernProjectErrors =
  | { type: "REPO_NOT_FOUND" }
  | { type: "SITE_NOT_FOUND" }
  | { type: "MULTIPLE_PROJECTS_WITH_SITE" }
  | { type: "NO_PROJECTS" };

interface GetFernProjectError {
  type: "error";
  error: GetFernProjectErrors;
}

export type GetFernProjectResult = GetFernProjectSuccess | GetFernProjectError;

type DocsYmlErrors = GetFernProjectErrors | { type: "DOCS_YML_MISSING" };

interface DocsYmlError {
  type: "error";
  error: DocsYmlErrors;
}

interface GetDocsYmlSuccess {
  type: "ok";
  result: string;
}

export type GetDocsYmlResult = GetDocsYmlSuccess | DocsYmlError;

interface UpdateDocsYmlSuccess {
  type: "ok";
}

export type UpdateDocsYmlResult = UpdateDocsYmlSuccess | DocsYmlError;

export type FernConfigJsonErrors =
  | GetFernProjectErrors
  | { type: "FERN_CONFIG_JSON_MALFORMED"; parsingErrorMessage: string }
  | { type: "FERN_CONFIG_JSON_MISSING" };

interface FernConfigJsonStructure {
  organization: string;
  version: string;
}

interface FernConfigJsonSuccess {
  type: "ok";
  result: FernConfigJsonStructure & {
    pathToFernConfigJson: string;
  };
}

interface FernConfigJsonError {
  type: "error";
  error: FernConfigJsonErrors;
}

export type GetFernConfigJsonResult =
  | FernConfigJsonSuccess
  | FernConfigJsonError;

export interface FernProject {
  docsYmlPath: string;
  fernConfigJsonPath: string;
}

/**
 * The GitLoader is used to get and update docs.yml from a remote git repository.
 */
export interface GitLoader {
  getFernProjectBySite(
    owner: string,
    repo: string,
    site: string
  ): Promise<GetFernProjectResult>;
  getDocsYml(
    owner: string,
    repo: string,
    site: string,
    ref?: string
  ): Promise<GetDocsYmlResult>;
  updateDocsYml(
    owner: string,
    repo: string,
    site: string,
    content: string,
    ref?: string
  ): Promise<UpdateDocsYmlResult>;
  getFernConfigJson(
    owner: string,
    repo: string,
    site: string
  ): Promise<GetFernConfigJsonResult>;
}

export const createEditableDocsLoader = async ({
  host,
  encodedDocsUrl,
  fernToken,
  forceRevalidate,
  branchName,
}: {
  host: string;
  encodedDocsUrl: string;
  fernToken?: string;
  gitLoader?: GitLoader;
  forceRevalidate?: boolean;
  branchName?: string;
}): Promise<EditableDocsLoader> => {
  const domain = decodeURIComponent(encodedDocsUrl);
  const docsLoader = await createCachedDocsLoader(
    host,
    encodeDocsLoaderDomain(domain, branchName),
    fernToken,
    {
      returnRawMarkdown: true,
      cacheConfig: {
        // For editable docs, we want shorter TTL so that cache stays fresh
        kvTtl: 5 * 60, // 5 minutes
        cacheKeySuffix: "editable",
        forceRevalidate,
      },
      skipAuth: true,
    }
  );

  return new EditableDocsLoader(docsLoader);
};
