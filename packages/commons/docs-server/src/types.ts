import { z } from "zod";

import { AuthEdgeConfig } from "@fern-api/docs-auth";
import { FernNavigation } from "@fern-api/fdr-sdk/navigation";

import type { FernColorPalette } from "./generateFernColors";

export type RgbaColor = { r: number; g: number; b: number; a?: number };

export interface FileData {
  src: string;
  height?: number;
  width?: number;
  blurDataURL?: string;
  blurWidth?: number;
  blurHeight?: number;
  alt?: string;
}

export interface FernColorTheme extends FernColorPalette {
  logo?: FileData;
  backgroundImage?: FileData;
  /**
   * If true, render a linear gradient in the background using the accent color
   */
  backgroundGradient: boolean;
}

export interface FernLayoutConfig {
  logoHeight: number;
  sidebarWidth: number;
  headerHeight: number;
  pageWidth: number | undefined;
  contentWidth: number;
  tabsPlacement: "SIDEBAR" | "HEADER";
  searchbarPlacement: "SIDEBAR" | "HEADER" | "HEADER_TABS";
  isHeaderDisabled: boolean;
}

const DocsMetadataSchema = z.object({
  domain: z.string(),
  basePath: z.string(),
  url: z.string(),
  org: z.string(),
  isPreview: z.boolean(),
});

type DocsMetadata = z.infer<typeof DocsMetadataSchema>;

export interface DocsLoader {
  domain: string;
  fern_token: string | undefined;

  getAuthConfig: () => Promise<AuthEdgeConfig | undefined>;

  /**
   * @returns the metadata for the given url, including the domain, base path, url, org, and isPreview
   */
  getMetadata: () => Promise<DocsMetadata>;

  /**
   * @returns a map of file names to their contents
   */
  getFiles: () => Promise<Record<string, FileData>>;

  /**
   * @returns a map of mdx bundler files
   */
  getMdxBundlerFiles: () => Promise<Record<string, string>>;

  /**
   * @returns the api definition for the given id, pruned to the given nodes
   */
  getPrunedApi: (
    id: string,
    ...nodes: PruningNodeType[]
  ) => Promise<ApiDefinition.ApiDefinition>;

  /**
   * @returns the endpoint definition for the given api definition id and endpoint id
   */
  getEndpointById: (
    apiDefinitionId: string,
    endpointId: EndpointId
  ) => Promise<{
    endpoint: ApiDefinition.EndpointDefinition;
    nodes: FernNavigation.EndpointNode[];
    globalHeaders: ObjectProperty[];
    authSchemes: AuthScheme[];
    types: Record<TypeId, TypeDefinition>;
  }>;

  /**
   * @returns the endpoint definition for the given endpoint locator
   */
  getEndpointByLocator: (
    method: HttpMethod,
    path: string,
    /**
     * multiple endpoints can have the same method + path
     * the example can be used to disambiguate between them
     */
    example?: string
  ) => Promise<{
    apiDefinitionId: ApiDefinition.ApiDefinitionId;
    endpoint: ApiDefinition.EndpointDefinition;
    slugs: Slug[];
  }>;

  /**
   * @returns the root node of the docs (aware of authentication)
   */
  getRoot: () => Promise<FernNavigation.RootNode>;

  /**
   * @returns the navigation node for the given id
   */
  getNavigationNode: (id: string) => Promise<FernNavigation.NavigationNode>;

  /**
   * DO NOT USE THIS UNLESS YOU KNOW WHAT YOU ARE DOING.
   * This should never be exposed to the client, and should only be used for revalidation.
   * @returns the full root node of the docs (ignoring authentication)
   */
  unsafe_getFullRoot: () => Promise<FernNavigation.RootNode>;

  /**
   * @returns the config of the docs
   */
  getConfig: () => Promise<
    Omit<DocsV1Read.DocsDefinition["config"], "navigation" | "root">
  >;

  /**
   * @returns the markdown content for the given page id
   */
  getPage: (pageId: string) => Promise<{
    filename: string;
    markdown: string;
    editThisPageUrl?: string;
  }>;

  getColors: () => Promise<{
    light?: FernColorTheme;
    dark?: FernColorTheme;
  }>;

  getFonts: () => Promise<FernFonts>;

  getLayout: () => Promise<FernLayoutConfig>;

  getAuthState: (pathname?: string) => Promise<AuthState>;

  getEdgeFlags: () => Promise<EdgeFlags>;

  getBaseUrl: () => Promise<string>;
}
