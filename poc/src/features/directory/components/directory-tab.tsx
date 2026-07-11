import { useMemo, useState } from 'react'
import {
  BookmarkSimple,
  Cards,
  DownloadSimple,
  ListBullets,
  Rows,
  Trash,
} from 'phosphor-react'
import { toast } from 'sonner'
import { RoleGate, useRole } from '@/context/role-context'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DataTable } from '@/components/common/data-table/table'
import { companyById, type Employee } from '../data/directory'
import { COMPANY_FIELD_RESTRICTIONS } from '../data/directory-config'
import {
  applyFilters,
  EMPTY_FILTERS,
  type DirectoryFilters,
} from '../data/filters'
import {
  type DirectoryStore,
  type DirectoryViewMode,
} from '../hooks/use-directory'
import { type DirectoryConfigStore } from '../hooks/use-directory-config'
import { type TimelineStore } from '../hooks/use-timeline'
import { exportDirectoryResults } from '../utils/export'
import { scopedCompanies } from '../utils/org'
import { AdvancedSearch } from './advanced-search'
import { buildDirectoryColumns } from './directory-table-columns'
import { DirectoryCardView, DirectoryCompactView } from './directory-views'
import { SavedSearchOverlay } from './saved-search-overlay'
import { TimelineSheet } from './timeline-sheet'

interface DirectoryTabProps {
  store: DirectoryStore
  config: DirectoryConfigStore
  timeline: TimelineStore
}

const VIEW_MODES: {
  value: DirectoryViewMode
  label: string
  icon: React.ReactNode
}[] = [
  {
    value: 'list',
    label: 'List',
    icon: <ListBullets size={13} weight='bold' />,
  },
  { value: 'card', label: 'Cards', icon: <Cards size={13} weight='bold' /> },
  {
    value: 'compact',
    label: 'Compact',
    icon: <Rows size={13} weight='bold' />,
  },
]

/**
 * Employee directory: list / card / compact views (DIR-01), privacy-governed
 * contact details (DIR-02/10/21), advanced search with saved searches and
 * exports (DIR-06/07/08) and cross-company scopes (DIR-09/12/15/16).
 */
export function DirectoryTab({ store, config, timeline }: DirectoryTabProps) {
  const { role } = useRole()
  const [filters, setFilters] = useState<DirectoryFilters>({ ...EMPTY_FILTERS })
  const [selectedRows, setSelectedRows] = useState<Employee[]>([])
  const [resetSelectionKey, setResetSelectionKey] = useState(0)
  const [saveOverlayOpen, setSaveOverlayOpen] = useState(false)
  const [timelineEmployee, setTimelineEmployee] = useState<Employee | null>(
    null
  )

  // Tenant scoping (DIR-16): rows outside the caller's grant never surface.
  const companies = useMemo(() => scopedCompanies(role), [role])
  const crossCompany = companies.length > 1
  const scopedEmployees = useMemo(() => {
    const ids = new Set(companies.map((c) => c.id))
    return store.employees.filter((e) => ids.has(e.companyId))
  }, [store.employees, companies])

  const results = useMemo(
    () => applyFilters(scopedEmployees, filters),
    [scopedEmployees, filters]
  )

  const columns = useMemo(
    () =>
      buildDirectoryColumns({
        role,
        config: config.privacyConfig,
        customFields: config.customFields,
        showCompany: crossCompany,
        onViewTimeline: setTimelineEmployee,
      }),
    [role, config.privacyConfig, config.customFields, crossCompany]
  )

  // Per-company privacy holds inside aggregated results (DIR-15).
  const restrictedNote = useMemo(() => {
    if (!crossCompany) return null
    const restricted = companies.filter(
      (c) => (COMPANY_FIELD_RESTRICTIONS[c.id] ?? []).length > 0
    )
    return restricted.length > 0
      ? `Per-company privacy applies to each record — ${restricted
          .map((c) => c.name)
          .join(
            ', '
          )} withholds restricted fields on its own records, even in aggregated results.`
      : null
  }, [crossCompany, companies])

  const handleExport = (format: 'xlsx' | 'csv') => {
    const rows = selectedRows.length > 0 ? selectedRows : results
    const fileName = exportDirectoryResults(
      rows,
      role,
      config.privacyConfig,
      config.customFields,
      format,
      crossCompany
    )
    toast.success(
      `${fileName} exported — ${rows.length} employee(s), privacy-filtered for ${role}`
    )
    setSelectedRows([])
    setResetSelectionKey((k) => k + 1)
  }

  const applySavedSearch = (id: string) => {
    const search = store.savedSearches.find((s) => s.id === id)
    if (!search) return
    setFilters({ ...search.filters, custom: { ...search.filters.custom } })
    toast.info(`Saved search "${search.name}" applied`)
  }

  return (
    <div className='w-full'>
      {crossCompany && (
        <p className='text-blue-1400 bg-blue-150 mb-3 rounded-md px-3 py-2 text-xs'>
          {role === 'Portfolio Admin'
            ? `Portfolio scope — browsing ${companies.length} companies across your portfolio. Each result carries its company identifier.`
            : role === 'Platform Admin'
              ? `Platform scope — all ${companies.length} tenant companies, each read through its own tenant scope.`
              : `Group scope — searching across ${companies.map((c) => c.name).join(', ')}. Results outside your group are withheld.`}
          {restrictedNote ? ` ${restrictedNote}` : ''}
        </p>
      )}
      <RoleGate roles={['Employee (Non-User)']}>
        <p className='text-neutral-1900 bg-vanilla-400/40 mb-3 rounded-md px-3 py-2 text-xs'>
          You are browsing as a non-user employee: you appear in this directory
          and the org chart even without a system login, with only permitted
          fields exposed.
        </p>
      </RoleGate>

      <AdvancedSearch
        filters={filters}
        onChange={setFilters}
        employees={scopedEmployees}
        customFields={config.customFields}
        companies={companies}
      />

      <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
        <div className='flex items-center gap-2'>
          <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
            Employees ({results.length})
          </h2>
          {/* View switcher (DIR-01) — the choice persists across visits. */}
          <div className='flex items-center gap-1 rounded-[6px] border border-gray-200 bg-white p-0.5'>
            {VIEW_MODES.map((mode) => (
              <Button
                key={mode.value}
                variant={store.viewMode === mode.value ? 'default' : 'ghost'}
                className='h-6 gap-1 px-2 text-xs'
                onClick={() => store.setViewMode(mode.value)}
              >
                {mode.icon}
                {mode.label}
              </Button>
            ))}
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <RoleGate roles={['Company Admin']}>
            {/* Saved searches (DIR-07) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' className='h-7 gap-1 px-2 text-xs'>
                  <BookmarkSimple size={13} weight='bold' />
                  Saved searches ({store.savedSearches.length})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='min-w-[240px]'>
                <DropdownMenuLabel className='text-xs'>
                  Apply a saved search
                </DropdownMenuLabel>
                {store.savedSearches.length === 0 && (
                  <DropdownMenuItem disabled>
                    No saved searches yet
                  </DropdownMenuItem>
                )}
                {store.savedSearches.map((s) => (
                  <DropdownMenuItem
                    key={s.id}
                    className='flex items-center justify-between gap-2'
                    onClick={() => applySavedSearch(s.id)}
                  >
                    <span>
                      {s.name}
                      <span className='text-neutral-1000 ml-1 text-xs'>
                        · {s.createdAt}
                      </span>
                    </span>
                    <Trash
                      size={13}
                      className='text-neutral-1000 hover:text-destructive'
                      onClick={(e) => {
                        e.stopPropagation()
                        store.deleteSavedSearch(s.id)
                      }}
                    />
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSaveOverlayOpen(true)}>
                  Save current criteria…
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Export search results (DIR-08) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' className='h-7 gap-1 px-2 text-xs'>
                  <DownloadSimple size={13} weight='bold' />
                  Export
                  {selectedRows.length > 0 ? ` (${selectedRows.length})` : ''}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='min-w-[200px]'>
                <DropdownMenuLabel className='text-xs'>
                  {selectedRows.length > 0
                    ? `Export ${selectedRows.length} selected`
                    : `Export all ${results.length} results`}
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleExport('xlsx')}>
                  Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                  CSV (.csv)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </RoleGate>
        </div>
      </div>

      {store.viewMode === 'list' && (
        <DataTable
          columns={columns}
          data={results}
          variant='no-status'
          resetSelectionKey={resetSelectionKey}
          onSelectionChange={(rows) => setSelectedRows(rows)}
          onRowClick={(row) => setTimelineEmployee(row)}
        />
      )}
      {store.viewMode === 'card' && (
        <DirectoryCardView
          employees={results}
          role={role}
          config={config.privacyConfig}
          customFields={config.customFields}
          showCompany={crossCompany}
          onViewTimeline={setTimelineEmployee}
        />
      )}
      {store.viewMode === 'compact' && (
        <DirectoryCompactView
          employees={results}
          role={role}
          config={config.privacyConfig}
          showCompany={crossCompany}
          onViewTimeline={setTimelineEmployee}
        />
      )}

      {crossCompany && filters.companyId !== 'all' && (
        <p className='text-neutral-1000 mt-2 text-xs'>
          Scoped to {companyById(filters.companyId)?.name} — rows are read only
          through that company's tenant scope.
        </p>
      )}

      <SavedSearchOverlay
        open={saveOverlayOpen}
        onOpenChange={setSaveOverlayOpen}
        filters={filters}
        savedSearches={store.savedSearches}
        onCreate={store.addSavedSearch}
        onUpdate={store.updateSavedSearch}
      />

      {/* Employee Timeline drill-down — "View timeline" row/card action. */}
      <TimelineSheet
        employee={timelineEmployee}
        timeline={timeline}
        onOpenChange={(open) => {
          if (!open) setTimelineEmployee(null)
        }}
      />
    </div>
  )
}
