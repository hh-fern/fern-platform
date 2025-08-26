import {
  type ReactNode,
  createContext,
  useContext,
  useRef,
  useSyncExternalStore,
} from "react";

import { createSiteEditorLocalStorage } from "./SiteEditorStorage";
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
  const defaultStoreRef = useRef<SiteEditorStore | null>(null);

  if (!store && !defaultStoreRef.current) {
    defaultStoreRef.current = new SiteEditorStore(
      createSiteEditorLocalStorage()
    );
  }

  const defaultStore = store ?? defaultStoreRef.current;

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

  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot);

  return snapshot;
}
