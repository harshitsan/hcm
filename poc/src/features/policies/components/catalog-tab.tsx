import { useMemo, useState } from 'react'
import {
  Archive,
  ArrowsClockwise,
  ClockCounterClockwise,
  Eye,
  GitBranch,
  Plus,
} from 'phosphor-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/common/data-table/table'
import { useRole } from '@/context/role-context'
import { type Policy, type PolicyAttachment } from '../data/policies'
import { isActiveStatus, policyVisibleToRole } from '../data/policy-utils'
import { type PoliciesStore, type VersionDraft } from '../hooks/use-policies'
import {
  CatalogFilters,
  CatalogPagination,
  type StatusFilter,
} from './catalog-controls'
import {
  buildPolicyRow,
  policiesTableColumns,
  type PolicyRow,
} from './policies-table-columns'
import { PolicyPreviewDialog } from './policy-preview-dialog'
import { PolicyWizard } from './policy-wizard'
import { toScope, type WizardValues } from './policy-wizard-schema'
import { VersionHistorySheet } from './version-history-sheet'

const PAGE_SIZE = 10

/**
 * Policy Documents catalog (POL-01/21/22/26/27/28/29): filterable, searchable,
 * paginated list with the authoring wizard, preview, version history and
 * retirement — maintenance actions role-controlled with denied attempts
 * audited (POL-08/10/11).
 */
export function CatalogTab({ store }: { store: PoliciesStore }) {
  const { role } = useRole()

  const [searchInput, setSearchInput] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [page, setPage] = useState(0)

  const [selectedRows, setSelectedRows] = useState<PolicyRow[]>([])
  const [resetSelectionKey, setResetSelectionKey] = useState(0)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [versionTarget, setVersionTarget] = useState<Policy | null>(null)
  const [previewPolicy, setPreviewPolicy] = useState<Policy | null>(null)
  const [historyPolicy, setHistoryPolicy] = useState<Policy | null>(null)
  const [confirmRetire, setConfirmRetire] = useState(false)

  const maintain = store.canMaintain(role)

  // Role-controlled visibility: each admin sees only their org slice (POL-10/11).
  const rows = useMemo(
    () =>
      store.policies
        .filter((p) => policyVisibleToRole(p, role))
        .map(buildPolicyRow),
    [store.policies, role]
  )

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (
          appliedSearch &&
          !r.name.toLowerCase().includes(appliedSearch.toLowerCase())
        )
          return false
        if (statusFilter === 'active') return isActiveStatus(r.status)
        if (statusFilter === 'inactive') return !isActiveStatus(r.status)
        return true
      }),
    [rows, appliedSearch, statusFilter]
  )

  // Pagination operates over the filtered result set (POL-28).
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const paged = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)
  const rangeStart = filtered.length === 0 ? 0 : safePage * PAGE_SIZE + 1
  const rangeEnd = Math.min((safePage + 1) * PAGE_SIZE, filtered.length)

  const clearSelection = () => {
    setSelectedRows([])
    setResetSelectionKey((k) => k + 1)
  }

  /** Denied maintenance attempts are blocked and audited (POL-08). */
  const guard = (action: string, target: string): boolean => {
    if (maintain) return true
    store.recordDenied(role, action, target)
    return false
  }

  const handleNew = () => {
    if (!guard('Attempted policy creation', 'New policy document')) return
    setVersionTarget(null)
    setWizardOpen(true)
  }

  const handleNewVersion = () => {
    if (selectedRows.length !== 1) return
    const target = selectedRows[0].policy
    if (!guard('Attempted new version', target.name)) return
    setVersionTarget(target)
    setWizardOpen(true)
  }

  const handleWizardSubmit = (
    values: WizardValues,
    attachment: PolicyAttachment | null,
    publish: boolean
  ): boolean => {
    const version: VersionDraft = {
      editionName: values.editionName,
      effectiveFrom: values.effectiveFrom,
      effectiveTill: values.effectiveTill ? values.effectiveTill : null,
      content: values.content,
      attachment,
      status: publish ? 'published' : 'draft',
      changeNote: values.changeNote,
      createdBy: role,
    }
    if (versionTarget) {
      const ok = store.addVersion(versionTarget.id, version, toScope(values), role)
      if (ok) clearSelection()
      return ok
    }
    store.addPolicy(
      {
        name: values.name,
        type: values.type,
        category: values.category,
        ownerLevel: values.ownerLevel,
        ownerName: values.ownerName,
        linkedModules: values.linkedModules,
        scope: toScope(values),
        version,
      },
      role
    )
    clearSelection()
    return true
  }

  const onConfirmRetire = () => {
    selectedRows.forEach((r) => store.retirePolicy(r.policy.id, role))
    setConfirmRetire(false)
    clearSelection()
  }

  return (
    <div className='w-full'>
      {/* Search by name + Active/Inactive filter + Reset (POL-21/22) */}
      <CatalogFilters
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        onSearch={() => {
          setAppliedSearch(searchInput.trim())
          setPage(0)
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={(v) => {
          setStatusFilter(v)
          setPage(0)
        }}
        onReset={() => {
          setSearchInput('')
          setAppliedSearch('')
          setStatusFilter('all')
          setPage(0)
        }}
        refreshedAt={store.refreshedAt}
      />

      {/* Section header + action toolbar */}
      <div className='mb-3 flex items-center justify-between'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          Policy Documents ({filtered.length})
        </h2>
        <div className='flex items-center gap-3'>
          {selectedRows.length > 0 && (
            <span className='text-neutral-1000 text-xs'>
              {selectedRows.length} selected
            </span>
          )}
          <Button
            variant='icon2'
            onClick={store.refresh}
            className='text-neutral-1900 h-7 w-7'
            aria-label='Refresh'
            title='Refresh list'
          >
            <ArrowsClockwise size={16} weight='bold' />
          </Button>
          <Button
            variant='icon2'
            onClick={() => setPreviewPolicy(selectedRows[0]?.policy ?? null)}
            className='text-neutral-1900 h-7 w-7'
            disabled={selectedRows.length !== 1}
            aria-label='Preview'
            title='Preview the selected policy'
          >
            <Eye size={16} weight='bold' />
          </Button>
          <Button
            variant='icon2'
            onClick={() => setHistoryPolicy(selectedRows[0]?.policy ?? null)}
            className='text-neutral-1900 h-7 w-7'
            disabled={selectedRows.length !== 1}
            aria-label='Version history'
            title='Version history of the selected policy'
          >
            <ClockCounterClockwise size={16} weight='bold' />
          </Button>
          <Button
            variant='icon2'
            onClick={handleNewVersion}
            className='text-neutral-1900 h-7 w-7'
            disabled={selectedRows.length !== 1}
            aria-label='New version'
            title='Draft a new version of the selected policy'
          >
            <GitBranch size={16} weight='bold' />
          </Button>
          <Button
            variant='icon2'
            onClick={() => {
              if (selectedRows.length === 0) return
              if (!guard('Attempted retirement', selectedRows[0].name)) return
              setConfirmRetire(true)
            }}
            className='text-neutral-1900 h-7 w-7'
            disabled={
              selectedRows.length === 0 ||
              selectedRows.every((r) => r.policy.retired)
            }
            aria-label='Retire'
            title='Retire the selected policy'
          >
            <Archive size={16} weight='bold' />
          </Button>
          <Button
            variant='red'
            onClick={handleNew}
            className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
          >
            <Plus size={10} weight='bold' />
            Add new policy document
          </Button>
        </div>
      </div>

      <DataTable
        columns={policiesTableColumns}
        data={paged}
        variant='no-status'
        resetSelectionKey={resetSelectionKey}
        onSelectionChange={(r) => setSelectedRows(r)}
        onRowClick={(row) => setPreviewPolicy(row.policy)}
      />

      {/* Paginated with a visible total count (POL-28) */}
      <CatalogPagination
        total={filtered.length}
        page={safePage}
        pageCount={pageCount}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        onPageChange={setPage}
      />

      <PolicyWizard
        open={wizardOpen}
        onOpenChange={(open) => {
          setWizardOpen(open)
          if (!open) setVersionTarget(null)
        }}
        policy={versionTarget}
        onSubmit={handleWizardSubmit}
      />

      <PolicyPreviewDialog
        open={previewPolicy !== null}
        onOpenChange={(o) => {
          if (!o) setPreviewPolicy(null)
        }}
        policy={previewPolicy}
        onPublish={(p, v) => {
          if (!guard('Attempted publish', `${p.name} — ${v.editionName}`)) return
          store.publishVersion(p.id, v.version, role)
          setPreviewPolicy(null)
          clearSelection()
        }}
      />

      <VersionHistorySheet
        open={historyPolicy !== null}
        onOpenChange={(o) => {
          if (!o) setHistoryPolicy(null)
        }}
        policy={historyPolicy}
      />

      <AlertDialog open={confirmRetire} onOpenChange={setConfirmRetire}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Retire {selectedRows.length === 1 ? 'policy' : 'policies'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedRows.length === 1
                ? `${selectedRows[0]?.name} will no longer apply to its population.`
                : `${selectedRows.length} policies will no longer apply to their populations.`}{' '}
              Version history remains available for audit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirmRetire}
              className='bg-destructive hover:bg-destructive/90 text-white'
            >
              Retire
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
