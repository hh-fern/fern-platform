const RootNodeStoreContext = React.createContext<
  UseBoundStore<StoreApi<RootNodeState>>
>(createRootNodeStore(new Map()));

export function RootNodeProvider({
  children,
  sidebarRootNodesToChildToParentsMap,
}: {
  children: React.ReactNode;
  sidebarRootNodesToChildToParentsMap: ReadonlyMap<
    FernNavigation.NodeId,
    ReadonlyMap<FernNavigation.NodeId, FernNavigation.NodeId[]>
  >;
}) {
  const store = useLazyRef(() =>
    createRootNodeStore(sidebarRootNodesToChildToParentsMap)
  );
  return (
    <RootNodeStoreContext.Provider value={store.current}>
      {children}
    </RootNodeStoreContext.Provider>
  );
}
