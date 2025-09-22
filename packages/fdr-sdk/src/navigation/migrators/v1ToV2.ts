import { UnreachableCaseError } from "ts-essentials";

import visitDiscriminatedUnion from "@fern-api/ui-core-utils/visitDiscriminatedUnion";

import { V1 } from "../versions";
import type {
  ApiPackageChild,
  ApiPackageNode,
  ApiReferenceNode,
  ChangelogEntryNode,
  ChangelogMonthNode,
  ChangelogNode,
  ChangelogYearNode,
  EndpointNode,
  EndpointPairNode,
  GrpcNode,
  LandingPageNode,
  LinkNode,
  NavigationChild,
  PageNode,
  ProductChild,
  ProductGroupNode,
  ProductNode,
  RootChild,
  RootNode,
  SectionNode,
  SidebarGroupNode,
  SidebarRootChild,
  SidebarRootNode,
  TabChild,
  TabNode,
  TabbedNode,
  UnversionedNode,
  VersionChild,
  VersionNode,
  VersionedNode,
  WebSocketNode,
  WebhookNode,
} from "../versions/latest";
import {
  Availability,
  NodeId,
  PageId,
  ProductId,
  Slug,
} from "../versions/latest";

/**
 * This migration accounts for the following changes:
 * - add canonicalSlug to all nodes
 * - align availability enum with the rest of FDR
 */
export class FernNavigationV1ToLatest {
  static create(): FernNavigationV1ToLatest {
    return new FernNavigationV1ToLatest();
  }

  private constructor() {}

  // store the base slug
  #baseUrl: string | undefined;

  // this will store the product slug we are currently parsing
  // to be used when setting the canonical URL
  #currentProductSlug: string | undefined;

  // this will store the product slug we are currently parsing
  // to be used when setting the canonical URL
  #currentDefaultVersionSlug: string | undefined;

  public root = (node: V1.RootNode): RootNode => {
    this.#baseUrl = Slug(node.slug);
    const latest: RootNode = {
      type: "root",
      child: visitDiscriminatedUnion(node.child)._visit<RootChild>({
        versioned: (value) => this.versioned(value, [node]),
        unversioned: (value) => this.unversioned(value, [node]),
        productgroup: (value) => this.productGroup(value, [node]),
      }),
      version: "v2",
      title: node.title,
      id: NodeId(node.id),
      pointsTo: node.pointsTo ? Slug(node.pointsTo) : undefined,
      slug: Slug(node.slug),
      canonicalSlug: undefined,
      icon: node.icon,
      hidden: node.hidden,
      authed: node.authed,
      viewers: node.viewers,
      orphaned: node.orphaned,
      roles: node.roles,
      featureFlags: node.featureFlags,
    };

    return latest;
  };

  public versioned = (
    node: V1.VersionedNode,
    parents: V1.NavigationNode[]
  ): VersionedNode => {
    if (node.children.length === 0) {
      return {
        type: "versioned",
        id: NodeId(node.id),
        children: [],
      };
    }

    let defaultVersionIdx = node.children.findIndex((child) => child.default);
    if (defaultVersionIdx === -1) {
      defaultVersionIdx = 0;
    }

    /**
     * the default version should be the preferred canonical slug
     */
    const defaultVersionV1 = node.children[defaultVersionIdx];
    if (!defaultVersionV1) {
      throw new Error("default version is undefined");
    }

    this.#currentDefaultVersionSlug = Slug(defaultVersionV1.slug);

    const defaultVersion = this.version(defaultVersionV1, [...parents, node]);

    /**
     * visit the rest of the children, but splice the default version in its original position
     */
    const children = [
      ...node.children
        .slice(0, defaultVersionIdx)
        .map((child) => this.version(child, [...parents, node])),
      defaultVersion,
      ...node.children
        .slice(defaultVersionIdx + 1)
        .map((child) => this.version(child, [...parents, node])),
    ];

    const latest: VersionedNode = {
      type: "versioned",
      id: NodeId(node.id),
      children,
    };

    return latest;
  };

  public version = (
    node: V1.VersionNode,
    parents: V1.NavigationNode[]
  ): VersionNode => {
    const landingPage = node.landingPage
      ? this.landingPage(node.landingPage, [...parents, node])
      : undefined;
    const latest: VersionNode = {
      type: "version",
      default: node.default,
      versionId: node.versionId,
      landingPage,
      child: visitDiscriminatedUnion(node.child)._visit<VersionChild>({
        tabbed: (value) => this.tabbed(value, [...parents, node]),
        sidebarRoot: (value) => this.sidebarRoot(value, [...parents, node]),
      }),
      availability: this.#availability(node.availability),
      title: node.title,
      slug: Slug(node.slug),
      canonicalSlug: undefined,
      icon: node.icon,
      hidden: node.hidden,
      authed: node.authed,
      id: NodeId(node.id),
      pointsTo: node.pointsTo ? Slug(node.pointsTo) : undefined,
      viewers: node.viewers,
      orphaned: node.orphaned,
      featureFlags: node.featureFlags,
    };
    return latest;
  };

  public landingPage = (
    node: V1.LandingPageNode,
    parents: V1.NavigationNode[]
  ): LandingPageNode => {
    const slug = Slug(node.slug);
    const canonicalSlug = this.#getAndSetCanonicalSlug(
      [node.pageId, this.#createTitleDisambiguationKey(node, parents)],
      slug
    );
    const latest: LandingPageNode = {
      type: "landingPage",
      title: node.title,
      slug,
      canonicalSlug,
      icon: node.icon,
      hidden: node.hidden,
      authed: node.authed,
      id: NodeId(node.id),
      pageId: PageId(node.pageId),
      noindex: node.noindex,
      viewers: node.viewers,
      orphaned: node.orphaned,
      featureFlags: node.featureFlags,
    };
    return latest;
  };

  public tabbed = (
    node: V1.TabbedNode,
    parents: V1.NavigationNode[]
  ): TabbedNode => {
    const latest: TabbedNode = {
      type: "tabbed",
      id: NodeId(node.id),
      children: node.children.map((child) =>
        visitDiscriminatedUnion(child)._visit<TabChild>({
          tab: (value) => this.tab(value, [...parents, node]),
          link: (value) => this.link(value, [...parents, node]),
          changelog: (value) => this.changelog(value, [...parents, node]),
        })
      ),
    };
    return latest;
  };

  public tab = (node: V1.TabNode, parents: V1.NavigationNode[]): TabNode => {
    const latest: TabNode = {
      type: "tab",
      child: this.sidebarRoot(node.child, [...parents, node]),
      title: node.title,
      slug: Slug(node.slug),
      canonicalSlug: undefined,
      icon: node.icon,
      hidden: node.hidden,
      authed: node.authed,
      id: NodeId(node.id),
      pointsTo: node.pointsTo ? Slug(node.pointsTo) : undefined,
      viewers: node.viewers,
      orphaned: node.orphaned,
      featureFlags: node.featureFlags,
    };
    return latest;
  };

  public link = (
    node: V1.LinkNode,
    _parents: V1.NavigationNode[]
  ): LinkNode => {
    const latest: LinkNode = {
      type: "link",
      id: NodeId(node.id),
      title: node.title,
      url: node.url,
      icon: node.icon,
    };
    return latest;
  };

  public unversioned = (
    node: V1.UnversionedNode,
    parents: V1.NavigationNode[]
  ): UnversionedNode => {
    const latest: UnversionedNode = {
      type: "unversioned",
      child: visitDiscriminatedUnion(node.child)._visit<VersionChild>({
        tabbed: (value) => this.tabbed(value, [...parents, node]),
        sidebarRoot: (value) => this.sidebarRoot(value, [...parents, node]),
      }),
      landingPage: node.landingPage
        ? this.landingPage(node.landingPage, [...parents, node])
        : undefined,
      id: NodeId(node.id),
    };

    return latest;
  };

  public productGroup = (
    node: V1.ProductGroupNode,
    parents: V1.NavigationNode[]
  ): ProductGroupNode => {
    const landingPage = node.landingPage
      ? this.landingPage(node.landingPage, [...parents, node])
      : undefined;
    if (node.children.length === 0) {
      return {
        type: "productgroup",
        landingPage,
        id: NodeId(node.id),
        children: [],
      };
    }

    let defaultProductIdx = node.children.findIndex((child) => child.default);

    if (defaultProductIdx === -1) {
      defaultProductIdx = 0;
    }

    /**
     * the default product should be the preferred canonical slug
     */
    const defaultProductV1 = node.children[defaultProductIdx];
    if (!defaultProductV1) {
      throw new Error("default product is undefined");
    }
    const defaultProduct = this.product(defaultProductV1, [...parents, node]);

    /**
     * visit the rest of the children, but splice the default product in its original position
     */
    const children = [
      ...node.children
        .slice(0, defaultProductIdx)
        .map((child) => this.product(child, [...parents, node])),
      defaultProduct,
      ...node.children
        .slice(defaultProductIdx + 1)
        .map((child) => this.product(child, [...parents, node])),
    ];

    const latest: ProductGroupNode = {
      type: "productgroup",
      landingPage,
      children,
      id: NodeId(node.id),
    };
    return latest;
  };

  public product = (
    node: V1.ProductNode,
    parents: V1.NavigationNode[]
  ): ProductNode => {
    this.#currentProductSlug = node.slug;
    const latest: ProductNode = {
      type: "product",
      id: NodeId(node.id),
      title: node.title,
      slug: Slug(node.slug),
      canonicalSlug: undefined,
      icon: node.icon,
      image: node.image,
      hidden: node.hidden,
      authed: node.authed,
      pointsTo: node.pointsTo ? Slug(node.pointsTo) : undefined,
      default: node.default,
      productId: ProductId(node.productId),
      child: visitDiscriminatedUnion(node.child)._visit<ProductChild>({
        unversioned: (value) => this.unversioned(value, [...parents, node]),
        versioned: (value) => this.versioned(value, [...parents, node]),
      }),
      subtitle: node.subtitle,
      viewers: node.viewers,
      orphaned: node.orphaned,
      featureFlags: node.featureFlags,
    };
    return latest;
  };

  public sidebarRoot = (
    node: V1.SidebarRootNode,
    parents: V1.NavigationNode[]
  ): SidebarRootNode => {
    const latest: SidebarRootNode = {
      type: "sidebarRoot",
      id: NodeId(node.id),
      children: node.children.map((child) =>
        visitDiscriminatedUnion(child)._visit<SidebarRootChild>({
          sidebarGroup: (value) => this.sidebarGroup(value, [...parents, node]),
          apiReference: (value) => this.apiReference(value, [...parents, node]),
          section: (value) => this.section(value, [...parents, node]),
        })
      ),
    };
    return latest;
  };

  public sidebarGroup = (
    node: V1.SidebarGroupNode,
    parents: V1.NavigationNode[]
  ): SidebarGroupNode => {
    const latest: SidebarGroupNode = {
      type: "sidebarGroup",
      id: NodeId(node.id),
      children: node.children.map((child) =>
        this.#navigationChild(child, [...parents, node])
      ),
    };
    return latest;
  };

  public page = (node: V1.PageNode, parents: V1.NavigationNode[]): PageNode => {
    const slug = Slug(node.slug);
    const canonicalSlug = this.#getAndSetCanonicalSlug(
      [node.pageId, this.#createTitleDisambiguationKey(node, parents)],
      slug
    );
    const latest: PageNode = {
      type: "page",
      id: NodeId(node.id),
      title: node.title,
      slug,
      canonicalSlug,
      icon: node.icon,
      hidden: node.hidden,
      authed: node.authed,
      pageId: PageId(node.pageId),
      noindex: node.noindex,
      viewers: node.viewers,
      orphaned: node.orphaned,
      featureFlags: node.featureFlags,
      availability: this.#availability(node.availability),
    };
    return latest;
  };

  public section = (
    node: V1.SectionNode,
    parents: V1.NavigationNode[]
  ): SectionNode => {
    const slug = Slug(node.slug);
    const overviewPageId = node.overviewPageId
      ? PageId(node.overviewPageId)
      : undefined;
    const canonicalSlug =
      overviewPageId != null
        ? this.#getAndSetCanonicalSlug(
            [overviewPageId, this.#createTitleDisambiguationKey(node, parents)],
            slug
          )
        : undefined;
    const latest: SectionNode = {
      type: "section",
      id: NodeId(node.id),
      children: node.children.map((child) =>
        this.#navigationChild(child, [...parents, node])
      ),
      title: node.title,
      slug,
      canonicalSlug,
      icon: node.icon,
      hidden: node.hidden,
      authed: node.authed,
      pointsTo: node.pointsTo ? Slug(node.pointsTo) : undefined,
      collapsed: node.collapsed,
      overviewPageId,
      noindex: node.noindex,
      viewers: node.viewers,
      orphaned: node.orphaned,
      featureFlags: node.featureFlags,
      availability: this.#availability(node.availability),
    };
    return latest;
  };

  public apiReference = (
    node: V1.ApiReferenceNode,
    parents: V1.NavigationNode[]
  ): ApiReferenceNode => {
    const slug = Slug(node.slug);
    const overviewPageId = node.overviewPageId
      ? PageId(node.overviewPageId)
      : undefined;
    const canonicalSlug =
      overviewPageId != null
        ? this.#getAndSetCanonicalSlug(
            [overviewPageId, this.#createTitleDisambiguationKey(node, parents)],
            slug
          )
        : undefined;
    const latest: ApiReferenceNode = {
      type: "apiReference",
      paginated: node.paginated,
      showErrors: node.showErrors,
      hideTitle: node.hideTitle,
      children: node.children.map((child) =>
        this.#apiPackageChild(child, [...parents, node])
      ),
      changelog: node.changelog
        ? this.changelog(node.changelog, [...parents, node])
        : undefined,
      playground: node.playground,
      title: node.title,
      slug,
      canonicalSlug,
      icon: node.icon,
      hidden: node.hidden,
      authed: node.authed,
      id: NodeId(node.id),
      overviewPageId,
      noindex: node.noindex,
      apiDefinitionId: node.apiDefinitionId,
      availability: this.#availability(node.availability),
      pointsTo: node.pointsTo ? Slug(node.pointsTo) : undefined,
      viewers: node.viewers,
      orphaned: node.orphaned,
      featureFlags: node.featureFlags,
    };
    return latest;
  };

  public changelog = (
    node: V1.ChangelogNode,
    parents: V1.NavigationNode[]
  ): ChangelogNode => {
    const slug = Slug(node.slug);
    const overviewPageId = node.overviewPageId
      ? PageId(node.overviewPageId)
      : undefined;
    const canonicalSlug =
      overviewPageId != null
        ? this.#getAndSetCanonicalSlug(overviewPageId, slug)
        : undefined;
    const latest: ChangelogNode = {
      type: "changelog",
      id: NodeId(node.id),
      children: node.children.map((child) =>
        this.changelogYear(child, [...parents, node])
      ),
      title: node.title,
      slug,
      canonicalSlug,
      icon: node.icon,
      hidden: node.hidden,
      authed: node.authed,
      overviewPageId,
      noindex: node.noindex,
      viewers: node.viewers,
      orphaned: node.orphaned,
      featureFlags: node.featureFlags,
    };
    return latest;
  };

  public changelogYear = (
    node: V1.ChangelogYearNode,
    parents: V1.NavigationNode[]
  ): ChangelogYearNode => {
    const latest: ChangelogYearNode = {
      type: "changelogYear",
      id: NodeId(node.id),
      children: node.children.map((child) =>
        this.changelogMonth(child, [...parents, node])
      ),
      title: node.title,
      slug: Slug(node.slug),
      canonicalSlug: undefined,
      icon: node.icon,
      hidden: node.hidden,
      authed: node.authed,
      year: node.year,
      viewers: node.viewers,
      orphaned: node.orphaned,
      featureFlags: node.featureFlags,
    };
    return latest;
  };

  public changelogMonth = (
    node: V1.ChangelogMonthNode,
    parents: V1.NavigationNode[]
  ): ChangelogMonthNode => {
    const latest: ChangelogMonthNode = {
      type: "changelogMonth",
      id: NodeId(node.id),
      children: node.children.map((child) =>
        this.changelogEntry(child, [...parents, node])
      ),
      title: node.title,
      slug: Slug(node.slug),
      canonicalSlug: undefined,
      icon: node.icon,
      hidden: node.hidden,
      authed: node.authed,
      month: node.month,
      viewers: node.viewers,
      orphaned: node.orphaned,
      featureFlags: node.featureFlags,
    };
    return latest;
  };

  public changelogEntry = (
    node: V1.ChangelogEntryNode,
    _parents: V1.NavigationNode[]
  ): ChangelogEntryNode => {
    const slug = Slug(node.slug);
    // NOTE: do NOT use title disambiguation key here, since the title may not always be unique
    const canonicalSlug = this.#getAndSetCanonicalSlug(node.pageId, slug);
    const latest: ChangelogEntryNode = {
      type: "changelogEntry",
      id: NodeId(node.id),
      title: node.title,
      slug,
      canonicalSlug,
      icon: node.icon,
      hidden: node.hidden,
      authed: node.authed,
      date: node.date,
      pageId: PageId(node.pageId),
      noindex: node.noindex,
      viewers: node.viewers,
      orphaned: node.orphaned,
      featureFlags: node.featureFlags,
      tags: node.tags,
    };
    return latest;
  };

  public apiPackage = (
    node: V1.ApiPackageNode,
    parents: V1.NavigationNode[]
  ): ApiPackageNode => {
    const slug = Slug(node.slug);
    const overviewPageId = node.overviewPageId
      ? PageId(node.overviewPageId)
      : undefined;
    const canonicalSlug =
      overviewPageId != null
        ? this.#getAndSetCanonicalSlug(
            [overviewPageId, this.#createTitleDisambiguationKey(node, parents)],
            slug
          )
        : undefined;
    const latest: ApiPackageNode = {
      type: "apiPackage",
      id: NodeId(node.id),
      children: node.children.map((child) =>
        this.#apiPackageChild(child, [...parents, node])
      ),
      title: node.title,
      slug,
      canonicalSlug,
      icon: node.icon,
      hidden: node.hidden,
      authed: node.authed,
      pointsTo: node.pointsTo ? Slug(node.pointsTo) : undefined,
      playground: node.playground,
      overviewPageId,
      noindex: node.noindex,
      apiDefinitionId: node.apiDefinitionId,
      availability: this.#availability(node.availability),
      viewers: node.viewers,
      orphaned: node.orphaned,
      featureFlags: node.featureFlags,
    };
    return latest;
  };

  public endpoint = (
    node: V1.EndpointNode,
    parents: V1.NavigationNode[]
  ): EndpointNode => {
    const apiDisambiguation = this.#createApiDisambiguationKey(parents);
    const slug = Slug(node.slug);
    const canonicalSlug = this.#getAndSetCanonicalSlug(
      [
        `${apiDisambiguation}:api:endpoint:${node.method}:${node.endpointId}`,
        this.#createTitleDisambiguationKey(node, parents),
      ],
      slug
    );
    const latest: EndpointNode = {
      type: "endpoint",
      id: NodeId(node.id),
      title: node.title,
      slug,
      canonicalSlug,
      icon: node.icon,
      hidden: node.hidden,
      authed: node.authed,
      playground: node.playground,
      apiDefinitionId: node.apiDefinitionId,
      availability: this.#availability(node.availability),
      method: node.method,
      endpointId: node.endpointId,
      isResponseStream: node.isResponseStream,
      viewers: node.viewers,
      orphaned: node.orphaned,
      featureFlags: node.featureFlags,
    };
    return latest;
  };

  public endpointPair = (
    node: V1.EndpointPairNode,
    parents: V1.NavigationNode[]
  ): EndpointPairNode => {
    const latest: EndpointPairNode = {
      type: "endpointPair",
      id: NodeId(node.id),
      nonStream: this.endpoint(node.nonStream, [...parents, node]),
      stream: this.endpoint(node.stream, [...parents, node]),
    };
    return latest;
  };

  public webSocket = (
    node: V1.WebSocketNode,
    parents: V1.NavigationNode[]
  ): WebSocketNode => {
    const apiDisambiguation = this.#createApiDisambiguationKey(parents);
    const slug = Slug(node.slug);
    const canonicalSlug = this.#getAndSetCanonicalSlug(
      [
        `${apiDisambiguation}:api:websocket:${node.webSocketId}`,
        this.#createTitleDisambiguationKey(node, parents),
      ],
      slug
    );
    const latest: WebSocketNode = {
      type: "webSocket",
      id: NodeId(node.id),
      title: node.title,
      slug,
      canonicalSlug,
      icon: node.icon,
      hidden: node.hidden,
      authed: node.authed,
      playground: node.playground,
      apiDefinitionId: node.apiDefinitionId,
      availability: this.#availability(node.availability),
      webSocketId: node.webSocketId,
      viewers: node.viewers,
      orphaned: node.orphaned,
      featureFlags: node.featureFlags,
    };
    return latest;
  };

  public webhook = (
    node: V1.WebhookNode,
    parents: V1.NavigationNode[]
  ): WebhookNode => {
    const apiDisambiguation = this.#createApiDisambiguationKey(parents);
    const slug = Slug(node.slug);
    const canonicalSlug = this.#getAndSetCanonicalSlug(
      [
        `${apiDisambiguation}:api:webhook:${node.method}:${node.webhookId}`,
        this.#createTitleDisambiguationKey(node, parents),
      ],
      slug
    );
    const latest: WebhookNode = {
      type: "webhook",
      id: NodeId(node.id),
      title: node.title,
      slug,
      canonicalSlug,
      icon: node.icon,
      hidden: node.hidden,
      authed: node.authed,
      apiDefinitionId: node.apiDefinitionId,
      availability: this.#availability(node.availability),
      method: node.method,
      webhookId: node.webhookId,
      viewers: node.viewers,
      orphaned: node.orphaned,
      featureFlags: node.featureFlags,
    };
    return latest;
  };

  public grpc = (node: V1.GrpcNode, parents: V1.NavigationNode[]): GrpcNode => {
    const apiDisambiguation = this.#createApiDisambiguationKey(parents);
    const slug = Slug(node.slug);
    const canonicalSlug = this.#getAndSetCanonicalSlug(
      [
        `${apiDisambiguation}:api:grpc:${node.method}:${node.grpcId}`,
        this.#createTitleDisambiguationKey(node, parents),
      ],
      slug
    );
    const latest: GrpcNode = {
      type: "grpc",
      id: NodeId(node.id),
      title: node.title,
      slug,
      canonicalSlug,
      icon: node.icon,
      hidden: node.hidden,
      authed: node.authed,
      apiDefinitionId: node.apiDefinitionId,
      availability: this.#availability(node.availability),
      method: node.method,
      grpcId: node.grpcId,
      viewers: node.viewers,
      orphaned: node.orphaned,
      featureFlags: node.featureFlags,
    };
    return latest;
  };

  #navigationChild = (
    child: V1.NavigationChild,
    parents: V1.NavigationNode[]
  ): NavigationChild => {
    return visitDiscriminatedUnion(child)._visit<NavigationChild>({
      apiReference: (value) => this.apiReference(value, parents),
      section: (value) => this.section(value, parents),
      link: (value) => this.link(value, parents),
      page: (value) => this.page(value, parents),
      changelog: (value) => this.changelog(value, parents),
    });
  };

  #apiPackageChild = (
    child: V1.ApiPackageChild,
    parents: V1.NavigationNode[]
  ): ApiPackageChild => {
    return visitDiscriminatedUnion(child)._visit<ApiPackageChild>({
      page: (value) => this.page(value, parents),
      link: (value) => this.link(value, parents),
      apiPackage: (value) => this.apiPackage(value, parents),
      endpoint: (value) => this.endpoint(value, parents),
      endpointPair: (value) => this.endpointPair(value, parents),
      webSocket: (value) => this.webSocket(value, parents),
      webhook: (value) => this.webhook(value, parents),
      grpc: (value) => this.grpc(value, parents),
    });
  };

  #availability(
    v1: V1.NavigationV1Availability | undefined
  ): Availability | undefined {
    if (v1 == null) {
      return undefined;
    }
    switch (v1) {
      case "beta":
        return Availability.Beta;
      case "deprecated":
        return Availability.Deprecated;
      case "generally-available":
        return Availability.GenerallyAvailable;
      case "in-development":
        return Availability.InDevelopment;
      case "pre-release":
        return Availability.PreRelease;
      case "stable":
        return Availability.Stable;
      default:
        throw new UnreachableCaseError(v1);
    }
  }

  #canonicalSlugs = new Map<string, Slug>();

  // return a match found with any key
  #getCanonicalSlug = (keyOrKeys: string | string[]) => {
    if (typeof keyOrKeys === "string") {
      return this.#canonicalSlugs.get(keyOrKeys);
    }

    for (const key of keyOrKeys) {
      const existing = this.#canonicalSlugs.get(key);

      // explicitly check for undefined because empty string is valid
      if (existing !== undefined) {
        return existing;
      }
    }

    return undefined;
  };

  // set all keys to use the same canonical url
  #setCanonicalSlug = (keyOrKeys: string | string[], fullCanonical: Slug) => {
    const baseSlug = this.#currentProductSlug ?? "" + this.#baseUrl;

    // if the canonical slug includes the default version, prefer an unversioned slug
    const normalizedCanonical = this.#currentDefaultVersionSlug
      ? fullCanonical.replace(
          new RegExp(`(^|/)${this.#currentDefaultVersionSlug}(/|$)`, "g"),
          `$1${baseSlug}$2`
        )
      : fullCanonical;

    // canonical slug should always begin without a slash
    const canonicalSlug = Slug(normalizedCanonical.replace(/^\//, ""));

    if (typeof keyOrKeys === "string") {
      this.#canonicalSlugs.set(keyOrKeys, canonicalSlug);
      return canonicalSlug;
    }

    // canonical slug should apply to all keys of a given page
    for (const key of keyOrKeys) {
      this.#canonicalSlugs.set(key, canonicalSlug);
    }

    return canonicalSlug;
  };

  // TODO: canonical url logic should account for RBAC, since we should always prefer the publicly available url over the private one (for SEO)
  #getAndSetCanonicalSlug = (
    keyOrKeys: string | string[],
    slug: Slug
  ): Slug | undefined => {
    if (keyOrKeys == null) {
      return undefined;
    }

    const existing = this.#getCanonicalSlug(keyOrKeys);
    if (existing != null) {
      return existing;
    }

    const canonicalSlug = this.#setCanonicalSlug(keyOrKeys, slug);
    return canonicalSlug;
  };

  #createTitleDisambiguationKey = (
    node: V1.NavigationNodeWithMetadata,
    parents: V1.NavigationNode[]
  ): string => {
    const unversionedParents = this.#findUnversionedParents(parents);
    const unversionedParentTitles = unversionedParents
      .filter(V1.hasMetadata)
      .map((parent) => parent.title);
    return [...unversionedParentTitles, node.title].join("###");
  };

  #createApiDisambiguationKey = (parents: V1.NavigationNode[]): string => {
    const unversionedParents = this.#findUnversionedParents(parents);
    const unversionedParentIds = unversionedParents
      .filter((parent) => parent.type === "apiReference")
      .map((parent) => parent.title.replaceAll(" ", ""));
    return [...unversionedParentIds].join(":");
  };

  #findUnversionedParents = (
    parents: V1.NavigationNode[]
  ): V1.NavigationNode[] => {
    const versionIdx = parents.findIndex((parent) => parent.type === "version");
    const unversionedParents =
      versionIdx >= 0 ? parents.slice(versionIdx + 1) : parents;
    return unversionedParents;
  };
}
