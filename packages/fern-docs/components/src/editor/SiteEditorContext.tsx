import {
  type ReactNode,
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

import { SiteEditorLocalStorage } from "./SiteEditorStorage";
import { SiteEditorStore } from "./SiteEditorStore";

const SiteEditorContext = createContext<SiteEditorStore | null>(null);

interface SiteEditorProviderProps {
  children: ReactNode;
  store?: SiteEditorStore;
}

export function SiteEditorProvider({
  children,
  store,
}: SiteEditorProviderProps) {
  const defaultStore = useMemo(
    () => store ?? new SiteEditorStore(new SiteEditorLocalStorage()),
    [store]
  );

  return (
    <SiteEditorContext.Provider value={defaultStore}>
      {children}
    </SiteEditorContext.Provider>
  );
}

// For use in both the client-side editor and the sidebar (via SidebarClientNavigationProvider)
// Also: the CommitButton should use this store (SideEditorContext) + DashboardApiClient to construct commits
export function useSiteEditorStore() {
  const store = useContext(SiteEditorContext);
  if (!store) {
    throw new Error(
      "useSiteEditorStore must be used within a SiteEditorProvider"
    );
  }

  const changes = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot
  );

  return {
    changes,
    isReady: store.isReady(),
    hasChanges: store.hasChanges(),
    getChange: (key: string) => store.getChange(key),
    setChange: (key: string, value: string) => store.setChange(key, value),
    removeChange: (key: string) => store.removeChange(key),
    clearAllChanges: () => store.clearAllChanges(),
  };
}
