import type {
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
  PageNode,
  ProductGroupNode,
  ProductNode,
  RootNode,
  SectionNode,
  SidebarGroupNode,
  SidebarRootNode,
  TabNode,
  TabbedNode,
  UnversionedNode,
  VersionNode,
  VersionedNode,
  WebSocketNode,
  WebhookNode,
} from "../../../client/generated/api/resources/navigation/resources/latest";

/**
 * All possible types of navigation nodes.
 */
export type NavigationNode =
  | RootNode
  | ProductGroupNode
  | VersionedNode
  | TabbedNode
  | SidebarRootNode
  | SidebarGroupNode
  | ProductNode
  | VersionNode
  | UnversionedNode
  | TabNode
  | LinkNode
  | PageNode
  | LandingPageNode
  | SectionNode
  | ApiReferenceNode
  | ChangelogNode
  | ChangelogYearNode
  | ChangelogMonthNode
  | ChangelogEntryNode
  | EndpointNode
  | EndpointPairNode
  | WebSocketNode
  | WebhookNode
  | GrpcNode
  | ApiPackageNode;
