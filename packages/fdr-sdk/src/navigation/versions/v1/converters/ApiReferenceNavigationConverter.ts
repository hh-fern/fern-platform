import { noop } from "ts-essentials";
import urljoin from "url-join";

import titleCase from "@fern-api/ui-core-utils/titleCase";
import visitDiscriminatedUnion from "@fern-api/ui-core-utils/visitDiscriminatedUnion";

import {
  ApiDefinitionId,
  type EndpointId,
  type GrpcId,
  PageId,
  type WebSocketId,
  type WebhookId,
} from "../../../../client/generated/api/resources/commons/types";
import type {
  ApiPackageChild,
  ApiPackageNode,
  ApiReferenceNode,
  EndpointNode,
  EndpointPairNode,
  GrpcNode,
  Slug,
  WebSocketNode,
  WebhookNode,
} from "../../../../client/generated/api/resources/navigation/resources/v1";
import type { DocsV1Read } from "../../../../client/types";
import { APIV1Read } from "../../../../client/types";
import { ApiDefinitionHolder } from "../../../ApiDefinitionHolder";
import { ROOT_PACKAGE_ID } from "../../../consts";
import { isSubpackage } from "../../../utils/isSubpackage";
import { stringifyEndpointPathParts } from "../../../utils/stringifyEndpointPathParts";
import { convertAvailability } from "../convertAvailability";
import { followRedirects } from "../followRedirect";
import { ChangelogNavigationConverter } from "./ChangelogConverter";
import { NodeIdGenerator } from "./NodeIdGenerator";
import { SlugGenerator } from "./SlugGenerator";

export class ApiReferenceNavigationConverter {
  public static convert(
    apiSection: DocsV1Read.ApiSection,
    api: APIV1Read.ApiDefinition,
    fullSlugMap?: Record<PageId, Slug>,
    noindexMap?: Record<PageId, boolean>,
    parentSlug?: SlugGenerator,
    idgen?: NodeIdGenerator,
    lexicographic?: boolean,
    disableEndpointPairs?: boolean,
    paginated?: boolean
  ): ApiReferenceNode {
    return new ApiReferenceNavigationConverter(
      apiSection,
      api,
      fullSlugMap,
      noindexMap,
      parentSlug,
      idgen ?? new NodeIdGenerator(),
      lexicographic,
      disableEndpointPairs,
      paginated
    ).convert();
  }

  apiDefinitionId: ApiDefinitionId;
  #holder: ApiDefinitionHolder;
  #visitedEndpoints = new Set<EndpointId>();
  #visitedWebSockets = new Set<WebSocketId>();
  #visitedWebhooks = new Set<WebhookId>();
  #visitedGrpcs = new Set<GrpcId>();
  #visitedSubpackages = new Set<string>();
  #idgen: NodeIdGenerator;
  private constructor(
    private apiSection: DocsV1Read.ApiSection,
    private api: APIV1Read.ApiDefinition,
    private fullSlugMap: Record<PageId, Slug> = {},
    private noindexMap: Record<PageId, boolean> = {},
    private parentSlug: SlugGenerator = SlugGenerator.init(""),
    idgen: NodeIdGenerator = new NodeIdGenerator(),
    private lexicographic: boolean = false,
    private disableEndpointPairs: boolean = false,
    private paginated: boolean | undefined
  ) {
    this.apiDefinitionId = ApiDefinitionId(api.id);
    this.#holder = ApiDefinitionHolder.create(api);
    this.#idgen = idgen;
  }

  private convert(): ApiReferenceNode {
    return this.#idgen.with(this.apiSection.urlSlug, (id) => {
      const overviewPageId =
        this.apiSection.navigation?.summaryPageId != null
          ? PageId(this.apiSection.navigation.summaryPageId)
          : undefined;
      const noindex =
        overviewPageId != null ? this.noindexMap[overviewPageId] : undefined;

      let slug = this.parentSlug.apply(this.apiSection);

      const frontmatterSlug =
        overviewPageId != null ? this.fullSlugMap[overviewPageId] : undefined;
      if (frontmatterSlug != null) {
        slug = this.parentSlug.set(frontmatterSlug);
      }

      const children = this.convertChildren(slug);
      const changelog =
        this.apiSection.changelog != null
          ? ChangelogNavigationConverter.convert(
              this.apiSection.changelog,
              this.fullSlugMap,
              this.noindexMap,
              slug,
              this.#idgen
            )
          : undefined;
      const pointsTo = followRedirects(children) ?? changelog?.slug;
      return {
        id,
        type: "apiReference",
        title: this.apiSection.title,
        apiDefinitionId: ApiDefinitionId(this.apiSection.api),
        overviewPageId,
        noindex,
        paginated:
          this.paginated ??
          (this.apiSection.longScrolling === false ? true : undefined),
        slug: slug.get(),
        icon: this.apiSection.icon,
        hidden: this.apiSection.hidden,
        hideTitle: this.apiSection.flattened,
        showErrors: this.apiSection.showErrors,
        changelog,
        children,
        availability: undefined,
        pointsTo,
        playground: undefined,
        authed: undefined,
        viewers: undefined,
        orphaned: undefined,
        featureFlags: undefined,
      };
    });
  }

  private convertChildren(parentSlug: SlugGenerator): ApiPackageChild[] {
    if (this.apiSection.navigation != null) {
      return this.convertApiNavigationItems(
        this.apiSection.navigation.items,
        parentSlug,
        APIV1Read.SubpackageId("root")
      );
    }

    return this.convertPackageToChildren(this.api.rootPackage, parentSlug);
  }

  private convertEndpointNode(
    endpointId: EndpointId,
    endpoint: APIV1Read.EndpointDefinition,
    parentSlug: SlugGenerator
  ): EndpointNode | EndpointPairNode {
    return this.#idgen.with(endpointId, (id) => {
      return {
        id,
        type: "endpoint",
        title: endpoint.name ?? stringifyEndpointPathParts(endpoint.path.parts),
        endpointId,
        slug: parentSlug.apply(endpoint).get(),
        icon: undefined,
        hidden: undefined,
        method: endpoint.method,
        apiDefinitionId: this.apiDefinitionId,
        availability: convertAvailability(endpoint.availability),
        isResponseStream: endpoint.response?.type.type === "stream",
        playground: undefined,
        authed: undefined,
        viewers: undefined,
        orphaned: undefined,
        featureFlags: undefined,
      };
    });
  }

  private convertGrpcNode(
    grpcId: GrpcId,
    grpcEndpoint: APIV1Read.EndpointDefinition,
    grpcMethodType: APIV1Read.GrpcMethod,
    parentSlug: SlugGenerator
  ): GrpcNode {
    return this.#idgen.with(grpcId, (id) => {
      return {
        id,
        type: "grpc",
        title:
          grpcEndpoint.name ??
          stringifyEndpointPathParts(grpcEndpoint.path.parts),
        grpcId,
        slug: parentSlug.apply(grpcEndpoint).get(),
        icon: undefined,
        hidden: undefined,
        method: grpcMethodType,
        apiDefinitionId: this.apiDefinitionId,
        availability: undefined,
        isResponseStream: false,
        playground: undefined,
        authed: undefined,
        viewers: undefined,
        orphaned: undefined,
        featureFlags: undefined,
      };
    });
  }

  private convertWebSocketNode(
    webSocketId: WebSocketId,
    webSocket: APIV1Read.WebSocketChannel,
    parentSlug: SlugGenerator
  ): WebSocketNode {
    return this.#idgen.with(webSocketId, (id) => ({
      id,
      type: "webSocket",
      title: webSocket.name ?? stringifyEndpointPathParts(webSocket.path.parts),
      webSocketId,
      slug: parentSlug.apply(webSocket).get(),
      icon: undefined,
      hidden: undefined,
      apiDefinitionId: this.apiDefinitionId,
      availability: convertAvailability(webSocket.availability),
      playground: undefined,
      authed: undefined,
      viewers: undefined,
      orphaned: undefined,
      featureFlags: undefined,
    }));
  }

  private convertWebhookNode(
    webhookId: WebhookId,
    webhook: APIV1Read.WebhookDefinition,
    parentSlug: SlugGenerator
  ): WebhookNode {
    return this.#idgen.with(webhookId, (id) => ({
      id,
      type: "webhook",
      title: webhook.name ?? urljoin("/", ...webhook.path),
      webhookId,
      slug: parentSlug.apply(webhook).get(),
      icon: undefined,
      hidden: undefined,
      method: webhook.method,
      apiDefinitionId: this.apiDefinitionId,
      availability: undefined,
      authed: undefined,
      viewers: undefined,
      orphaned: undefined,
      featureFlags: undefined,
    }));
  }

  private convertPackageToChildren(
    package_: APIV1Read.ApiDefinitionPackage,
    parentSlug: SlugGenerator
  ): ApiPackageChild[] {
    const children: ApiPackageChild[] = [];

    let subpackageId = isSubpackage(package_)
      ? package_.subpackageId
      : "__package__";
    while (package_.pointsTo != null) {
      subpackageId = package_.pointsTo;
      const pointsToSubpackage = this.api.subpackages[package_.pointsTo];
      if (pointsToSubpackage == null) {
        return [];
      }
      package_ = pointsToSubpackage;
    }

    if (this.#visitedSubpackages.has(subpackageId)) {
      return children;
    }

    package_.endpoints.forEach((endpoint) => {
      if (
        endpoint.protocol?.type === "grpc" &&
        endpoint.protocol.methodType != null
      ) {
        const grpcId = ApiDefinitionHolder.createGrpcId(endpoint, subpackageId);
        if (this.#visitedGrpcs.has(grpcId)) {
          return;
        }
        children.push(
          this.convertGrpcNode(
            grpcId,
            endpoint,
            endpoint.protocol.methodType,
            parentSlug
          )
        );
        this.#visitedGrpcs.add(grpcId);
      } else {
        const endpointId = ApiDefinitionHolder.createEndpointId(
          endpoint,
          subpackageId
        );
        if (this.#visitedEndpoints.has(endpointId)) {
          return;
        }
        children.push(
          this.convertEndpointNode(endpointId, endpoint, parentSlug)
        );
        this.#visitedEndpoints.add(endpointId);
      }
    });

    package_.websockets.forEach((webSocket) => {
      const webSocketId = ApiDefinitionHolder.createWebSocketId(
        webSocket,
        subpackageId
      );
      if (this.#visitedWebSockets.has(webSocketId)) {
        return;
      }
      children.push(
        this.convertWebSocketNode(webSocketId, webSocket, parentSlug)
      );
      this.#visitedWebSockets.add(webSocketId);
    });

    package_.webhooks.forEach((webhook) => {
      const webhookId = ApiDefinitionHolder.createWebhookId(
        webhook,
        subpackageId
      );
      if (this.#visitedWebhooks.has(webhookId)) {
        return;
      }
      children.push(this.convertWebhookNode(webhookId, webhook, parentSlug));
      this.#visitedWebhooks.add(webhookId);
    });

    package_.subpackages.forEach((subpackageId) => {
      const subpackage = this.api.subpackages[subpackageId];
      if (subpackage == null) {
        console.error(
          `Subpackage ${subpackageId} not found in ${this.apiDefinitionId}`
        );
        return;
      }
      const child = this.#idgen.with(
        subpackageId,
        (id): ApiPackageNode | undefined => {
          const slug = parentSlug.apply(subpackage);
          const subpackageChildren = this.convertPackageToChildren(
            subpackage,
            slug
          );
          if (subpackageChildren.length === 0) {
            return;
          }
          const pointsTo = followRedirects(subpackageChildren);
          return {
            id,
            type: "apiPackage",
            children: subpackageChildren,
            title: subpackage.displayName ?? titleCase(subpackage.name),
            slug: slug.get(),
            icon: undefined,
            hidden: undefined,
            overviewPageId: undefined,
            noindex: undefined,
            availability: undefined,
            apiDefinitionId: this.apiDefinitionId,
            pointsTo,
            playground: undefined,
            authed: undefined,
            viewers: undefined,
            orphaned: undefined,
            featureFlags: undefined,
          };
        }
      );
      if (child != null) {
        children.push(child);
      }
    });

    this.#visitedSubpackages.add(subpackageId);

    const toRet = this.mergeEndpointPairs(children);

    if (this.lexicographic) {
      toRet.sort((a, b) => {
        const aTitle = a.type === "endpointPair" ? a.nonStream.title : a.title;
        const bTitle = b.type === "endpointPair" ? b.nonStream.title : b.title;
        return aTitle.localeCompare(bTitle);
      });
    }

    return toRet;
  }

  private convertApiNavigationItems(
    items: DocsV1Read.ApiNavigationConfigItem[],
    parentSlug: SlugGenerator,
    subpackageId: APIV1Read.SubpackageId
  ): ApiPackageChild[] {
    const children: ApiPackageChild[] = [];
    let subpackage =
      subpackageId === "root"
        ? this.api.rootPackage
        : this.api.subpackages[subpackageId];
    if (subpackage == null) {
      throw new Error(
        `${subpackageId} is not present within known subpackages: ${Object.keys(this.api.subpackages).join(", ")}`
      );
    }
    while (subpackage.pointsTo != null) {
      subpackage = this.api.subpackages[subpackage.pointsTo];
      if (subpackage == null) {
        return [];
      }
    }
    const targetSubpackageId = isSubpackage(subpackage)
      ? subpackage.subpackageId
      : ROOT_PACKAGE_ID;
    const endpoints = new Map<string, APIV1Read.EndpointDefinition>();
    const webSockets = new Map<string, APIV1Read.WebSocketChannel>();
    const webhooks = new Map<string, APIV1Read.WebhookDefinition>();
    const grpc = new Map<string, APIV1Read.EndpointDefinition>();
    subpackage.endpoints.forEach((endpoint) => {
      endpoints.set(endpoint.id, endpoint);
    });
    subpackage.websockets.forEach((webSocket) => {
      webSockets.set(webSocket.id, webSocket);
    });
    subpackage.webhooks.forEach((webhook) => {
      webhooks.set(webhook.id, webhook);
    });
    subpackage.endpoints.forEach((endpoint) => {
      if (endpoint.protocol?.type === "grpc") {
        grpc.set(endpoint.id, endpoint);
      }
    });
    items.forEach((item) => {
      visitDiscriminatedUnion(item, "type")._visit({
        page: (page) => {
          children.push(
            this.#idgen.with(page.urlSlug, (id) => {
              const pageId = PageId(page.id);
              const noindex = this.noindexMap[pageId];
              return {
                id,
                type: "page",
                title: page.title,
                pageId,
                noindex,
                slug: parentSlug.apply(page).get(),
                icon: page.icon,
                hidden: page.hidden,
                authed: undefined,
                viewers: undefined,
                orphaned: undefined,
                featureFlags: undefined,
                availability: undefined,
              };
            })
          );
        },
        endpointId: (oldEndpointId) => {
          const endpoint = endpoints.get(oldEndpointId.value);
          if (endpoint == null) {
            console.error(
              `Endpoint ${oldEndpointId.value} not found in ${targetSubpackageId}`
            );
            return;
          }

          if (endpoint.protocol?.type === "grpc") {
            const grpcId = ApiDefinitionHolder.createGrpcId(
              endpoint,
              targetSubpackageId
            );
            children.push(
              this.convertGrpcNode(
                grpcId,
                endpoint,
                endpoint.protocol.methodType ?? "UNARY",
                parentSlug
              )
            );
            this.#visitedGrpcs.add(grpcId);
          } else {
            const endpointId = ApiDefinitionHolder.createEndpointId(
              endpoint,
              targetSubpackageId
            );
            children.push(
              this.convertEndpointNode(endpointId, endpoint, parentSlug)
            );
            this.#visitedEndpoints.add(endpointId);
          }
        },
        websocketId: (oldWebSocketId) => {
          const webSocket = webSockets.get(oldWebSocketId.value);
          if (webSocket == null) {
            console.error(
              `WebSocket ${oldWebSocketId.value} not found in ${targetSubpackageId}`
            );
            return;
          }
          const webSocketId = ApiDefinitionHolder.createWebSocketId(
            webSocket,
            targetSubpackageId
          );
          children.push(
            this.convertWebSocketNode(webSocketId, webSocket, parentSlug)
          );
          this.#visitedWebSockets.add(webSocketId);
        },
        webhookId: (oldWebhookId) => {
          const webhook = webhooks.get(oldWebhookId.value);
          if (webhook == null) {
            console.error(
              `Webhook ${oldWebhookId.value} not found in ${targetSubpackageId}`
            );
            return;
          }
          const webhookId = ApiDefinitionHolder.createWebhookId(
            webhook,
            targetSubpackageId
          );
          children.push(
            this.convertWebhookNode(webhookId, webhook, parentSlug)
          );
          this.#visitedWebhooks.add(webhookId);
        },
        subpackage: ({ subpackageId, items, summaryPageId }) => {
          const subpackage = this.api.subpackages[subpackageId];
          if (subpackage == null) {
            console.error(
              `Subpackage ${subpackageId} not found in ${targetSubpackageId}`
            );
            return;
          }
          let slug = parentSlug.apply(subpackage);

          const overviewPageId =
            summaryPageId != null ? PageId(summaryPageId) : undefined;
          const noindex =
            overviewPageId != null
              ? this.noindexMap[overviewPageId]
              : undefined;

          const frontmatterSlug =
            overviewPageId != null
              ? this.fullSlugMap[overviewPageId]
              : undefined;
          if (frontmatterSlug != null) {
            slug = this.parentSlug.set(frontmatterSlug);
          }

          this.#idgen.with(subpackageId, (id) => {
            const convertedItems = this.convertApiNavigationItems(
              items,
              slug,
              subpackageId
            );
            children.push({
              id,
              type: "apiPackage",
              children: convertedItems,
              title: subpackage.displayName ?? titleCase(subpackage.name),
              slug: slug.get(),
              icon: undefined,
              hidden: undefined,
              overviewPageId,
              noindex,
              availability: undefined,
              apiDefinitionId: this.apiDefinitionId,
              pointsTo: followRedirects(convertedItems),
              playground: undefined,
              authed: undefined,
              viewers: undefined,
              orphaned: undefined,
              featureFlags: undefined,
            });
          });
        },
        _other: noop,
      });
    });

    children.push(...this.convertPackageToChildren(subpackage, parentSlug));
    return this.mergeEndpointPairs(children);
  }

  private mergeEndpointPairs(children: ApiPackageChild[]): ApiPackageChild[] {
    // if batch stream toggle is disabled, return children as is and skip merging
    if (this.disableEndpointPairs) {
      return children;
    }

    const toRet: ApiPackageChild[] = [];

    const methodAndPathToEndpointNode = new Map<string, EndpointNode>();
    children.forEach((child) => {
      if (child.type !== "endpoint") {
        toRet.push(child);
        return;
      }

      const endpoint = this.#holder.endpoints.get(child.endpointId);
      if (endpoint == null) {
        throw new Error(`Endpoint ${child.endpointId} not found`);
      }

      const methodAndPath = `${endpoint.method} ${stringifyEndpointPathParts(endpoint.path.parts)}`;

      const existing = methodAndPathToEndpointNode.get(methodAndPath);
      methodAndPathToEndpointNode.set(methodAndPath, child);

      if (
        existing == null ||
        !toRet.includes(existing) ||
        existing.isResponseStream === child.isResponseStream
      ) {
        toRet.push(child);
        return;
      }

      const idx = toRet.indexOf(existing);
      const pairNode: EndpointPairNode = this.#idgen.with(
        "endpoint-pair",
        (id) => ({
          id,
          type: "endpointPair",
          stream: child.isResponseStream ? child : existing,
          nonStream: child.isResponseStream ? existing : child,
        })
      );

      toRet[idx] = pairNode;
    });

    return toRet;
  }
}
