import { createContext, useContext, type ReactNode } from 'react'
import { useSyncExternalStore } from 'react'
import { globalDesignerStore } from './store'
import type { DesignerStore, State } from './store'

const DesignerStoreContext = createContext<DesignerStore>(globalDesignerStore)

/** Wrap a subtree with a specific store instance (e.g. an ephemeral sheet canvas). */
export function DesignerStoreProvider({
  store,
  children,
}: {
  store: DesignerStore
  children: ReactNode
}): JSX.Element {
  return (
    <DesignerStoreContext.Provider value={store}>
      {children}
    </DesignerStoreContext.Provider>
  )
}

/** Returns the store instance from context (default: globalDesignerStore). */
export function useDesignerStoreApi(): DesignerStore {
  return useContext(DesignerStoreContext)
}

/** Context-aware selector hook — reads from whichever store is in context. */
export function useStore<T>(selector: (s: State) => T): T {
  const store = useContext(DesignerStoreContext)
  return useSyncExternalStore(store.subscribe, () => selector(store.getState()))
}
