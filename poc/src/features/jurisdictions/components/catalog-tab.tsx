import { useMemo, useState } from 'react'
import { ClockCounterClockwise, PencilSimple, Plus, Prohibit, Trash } from 'phosphor-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable } from '@/components/common/data-table/table'
import { RoleGate, useRole } from '@/context/role-context'
import {
  JURISDICTION_TYPES,
  type Jurisdiction,
} from '../data/jurisdictions'
import {
  countReferences,
  type CompanyRecord,
  type JurisdictionPolicy,
} from '../data/assignments'
import {
  type JurisdictionDraft,
  type JurisdictionsStore,
} from '../hooks/use-jurisdictions'
import { JurisdictionHistoryDialog } from './jurisdiction-history-dialog'
import { JurisdictionOverlay } from './jurisdiction-overlay'
import { buildJurisdictionColumns } from './jurisdictions-table-columns'

interface CatalogTabProps {
  store: JurisdictionsStore
  companies: CompanyRecord[]
  policies: JurisdictionPolicy[]
}

/**
 * The governed catalog of supported jurisdictions (JUR-01/02/03/12/15).
 * Platform Admin maintains entries; other roles browse the same single
 * catalog read-only. Removal is guarded when references exist.
 */
export function CatalogTab({ store, companies, policies }: CatalogTabProps) {
  const { hasRole } = useRole()
  const canManage = hasRole('Platform Admin')

  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedRows, setSelectedRows] = useState<Jurisdiction[]>([])
  const [resetSelectionKey, setResetSelectionKey] = useState(0)
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [editing, setEditing] = useState<Jurisdiction | null>(null)
  const [historyFor, setHistoryFor] = useState<Jurisdiction | null>(null)
  const [confirmRemove, setConfirmRemove] = useState(false)

  const refCounts = useMemo(
    () =>
      new Map(
        store.jurisdictions.map((j) => [
          j.id,
          countReferences(j.id, companies, policies),
        ])
      ),
    [store.jurisdictions, companies, policies]
  )

  const rows = useMemo(
    () =>
      typeFilter === 'all'
        ? store.jurisdictions
        : store.jurisdictions.filter((j) => j.type === typeFilter),
    [store.jurisdictions, typeFilter]
  )

  const columns = useMemo(() => buildJurisdictionColumns(refCounts), [refCounts])

  const clearSelection = () => {
    setSelectedRows([])
    setResetSelectionKey((prev) => prev + 1)
  }

  const handleSubmit = (draft: JurisdictionDraft) => {
    if (editing) store.updateJurisdiction(editing.id, draft)
    else store.addJurisdiction(draft)
    clearSelection()
  }

  const selected = selectedRows[0] ?? null
  const selectedRefs = selected ? refCounts.get(selected.id) : undefined
  const isReferenced = (selectedRefs?.total ?? 0) > 0

  const onConfirmRemove = () => {
    if (!selected) return
    // Referenced entries can only be deactivated — references stay intact.
    if (isReferenced) store.deactivateJurisdiction(selected.id)
    else store.deleteJurisdiction(selected.id)
    setConfirmRemove(false)
    clearSelection()
  }

  return (
    <div className='w-full'>
      <div className='mb-3 flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
            Supported catalog ({rows.length})
          </h2>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className='h-7 w-[200px]' variant='secondary'>
              <SelectValue placeholder='All types' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All types</SelectItem>
              {JURISDICTION_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='flex items-center gap-3'>
          <Button
            variant='icon2'
            onClick={() => selected && setHistoryFor(selected)}
            className='text-neutral-1900 h-7 w-7'
            disabled={selectedRows.length !== 1}
            aria-label='View history'
          >
            <ClockCounterClockwise size={16} weight='bold' />
          </Button>
          <RoleGate roles={['Platform Admin']}>
            <Button
              variant='icon2'
              onClick={() => {
                if (selectedRows.length !== 1) return
                setEditing(selectedRows[0])
                setOverlayOpen(true)
              }}
              className='text-neutral-1900 h-7 w-7'
              disabled={selectedRows.length !== 1}
              aria-label='Edit'
            >
              <PencilSimple size={16} weight='fill' />
            </Button>
            <Button
              variant='icon2'
              onClick={() => setConfirmRemove(true)}
              className='text-neutral-1900 h-7 w-7'
              disabled={selectedRows.length !== 1}
              aria-label='Delete or deactivate'
            >
              <Trash size={16} weight='bold' />
            </Button>
            <Button
              variant='red'
              onClick={() => {
                setEditing(null)
                setOverlayOpen(true)
              }}
              className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
            >
              <Plus size={10} weight='bold' />
              New Jurisdiction
            </Button>
          </RoleGate>
        </div>
      </div>

      {!canManage && (
        <p className='text-paragraph-sm text-neutral-1000 mb-2'>
          The catalog is governed by the Platform Admin. Your assignments,
          policies and tax settings all draw from these entries.
        </p>
      )}

      <DataTable
        columns={columns}
        data={rows}
        variant='no-status'
        resetSelectionKey={resetSelectionKey}
        onSelectionChange={(r) => setSelectedRows(r)}
      />

      <JurisdictionOverlay
        open={overlayOpen}
        onOpenChange={(open) => {
          setOverlayOpen(open)
          if (!open) setEditing(null)
        }}
        jurisdiction={editing}
        isDuplicate={store.isDuplicate}
        onSubmit={handleSubmit}
      />

      <JurisdictionHistoryDialog
        jurisdiction={historyFor}
        history={store.history}
        onClose={() => setHistoryFor(null)}
      />

      <AlertDialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isReferenced
                ? `${selected?.name} is still referenced`
                : `Delete ${selected?.name}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isReferenced
                ? `${selectedRefs?.companies} companies and ${selectedRefs?.policies} policies reference this jurisdiction, so it cannot be deleted. You can deactivate it instead — existing references are preserved but it can no longer be selected for new use.`
                : 'Nothing references this catalog entry, so it can be permanently removed. This can’t be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirmRemove}
              className='bg-destructive hover:bg-destructive/90 text-white'
            >
              {isReferenced ? (
                <>
                  <Prohibit size={14} weight='bold' /> Deactivate
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
