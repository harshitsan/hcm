/**
 * module-nav.ts — reverse navigation: workflow → the module page that
 * consumes it (the tab hosting that module's EngineArtifactsPanel).
 *
 * Module pages keep their Tabs uncontrolled/local, so deep-linking a tab is
 * done with a one-shot request: the link sets {route, tab} here, navigates,
 * and the destination page consumes the request when it mounts via
 * takeRequestedTab(route). A request is only honoured by the route it was
 * made for and is cleared on read, so stale requests never leak into later
 * visits.
 */
import { moduleByTarget } from '@/config/module-registry'
import type { TargetModule } from './business-logic'

/**
 * Tab value hosting the EngineArtifactsPanel on each module page.
 * Only exceptions are listed; every other module hosts it on 'admin'.
 * null = the panel renders outside the Tabs (always visible), so navigating
 * to the route is enough.
 */
const ENGINE_PANEL_TAB: Partial<Record<TargetModule, string | null>> = {
  'Asset Management': 'config',
  'Data Management': 'config',
  'Platform Admin': 'settings',
  Employees: null,
}

const DEFAULT_PANEL_TAB = 'admin'

export interface ModulePanelPath {
  route: string
  /** Tab to activate on arrival; null = no tab switch needed. */
  tab: string | null
}

/**
 * Where a workflow surfaces inside its module: the module's route plus the
 * tab to open. When an attachment names a submodule, that submodule's tab id
 * is used directly (submodule ids match the page's TabsTrigger values).
 */
export function modulePanelPath(
  module: TargetModule,
  submodule?: string
): ModulePanelPath | null {
  const def = moduleByTarget(module)
  if (!def) return null
  const tab =
    submodule ??
    (module in ENGINE_PANEL_TAB ? (ENGINE_PANEL_TAB[module] ?? null) : DEFAULT_PANEL_TAB)
  return { route: def.route, tab }
}

// ── One-shot requested-tab store ─────────────────────────────────────────────

let requested: { route: string; tab: string } | null = null

export function requestModuleTab(route: string, tab: string) {
  requested = { route, tab }
}

/**
 * Consume the pending tab request for `route`. Returns the tab once and
 * clears it; returns null when there is no request or it targets another
 * route. Call from a module page's Tabs initial-value expression.
 */
export function takeRequestedTab(route: string): string | null {
  if (requested && requested.route === route) {
    const tab = requested.tab
    requested = null
    return tab
  }
  return null
}
