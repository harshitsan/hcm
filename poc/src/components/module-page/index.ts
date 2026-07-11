/**
 * Module-page scaffold kit (worklist #22) — the canonical anatomy promoted
 * from what workflows and leave already do. New/refactored module surfaces
 * compose these instead of hand-rolling chrome, tabs, toolbars, pagers,
 * badges, empty states and detail sheets.
 */
export { ModulePage } from './module-page'
export { ModuleTabs, type TabDef } from './module-tabs'
export { SummaryCards, type SummaryItem } from './summary-cards'
export {
  TableToolbar,
  FilterSelect,
  SearchInput,
  CreateButton,
} from './table-toolbar'
export {
  RefreshButton,
  usePager,
  PagerControls,
} from './list-controls'
export {
  makeStatusBadge,
  type CanonicalBadgeVariant,
} from './status-badge'
export { EmptyStateCard, BlockedStateCard } from './state-cards'
export { AdminSections, type AdminSection } from './admin-sections'
export {
  DetailSheet,
  type DetailField,
  type DetailSection,
} from './detail-sheet'
export {
  SortableHeader,
  selectColumn,
  SectionToolbar,
} from '@/components/common/data-table/table-helpers'
export { exportCsv } from '@/utils/export-csv'
