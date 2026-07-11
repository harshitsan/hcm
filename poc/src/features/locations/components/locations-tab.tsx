import { useEffect, useMemo, useState } from 'react'
import { ArrowsClockwise, CaretLeft, CaretRight, PencilSimple, Plus, Trash } from 'phosphor-react'
import { toast } from 'sonner'
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
import { useRole } from '@/context/role-context'
import { CURRENT_COMPANY_ID, JURISDICTIONS } from '../data/locations'
import type { LocationsStore, LocationDraft } from '../hooks/use-locations'
import type { OrganizationStore } from '../hooks/use-organization'
import type { Ownership } from './location-badges'
import { DetailSheet } from '@/components/module-page'
import { LocationOverlay } from './location-overlay'
import { locationsTableColumns, type LocationRow } from './locations-table-columns'
import { LocationsSummary } from './locations-summary'

const PAGE_SIZE = 8

interface LocationsTabProps {
  store: LocationsStore
  org: OrganizationStore
}

/**
 * Metadata-driven locations grid: owned + shared-in locations for the
 * viewer's company (all companies for Platform Admin), with jurisdiction and
 * ownership filters, column search, pagination and refresh
 * (LOC-01/02/03/08/09/14/15/16/17/18).
 */
export function LocationsTab({ store, org }: LocationsTabProps) {
  const { hasRole } = useRole()
  const canManage = hasRole('Company Admin', 'Group Company Admin')
  const isPlatformAdmin = hasRole('Platform Admin')

  const [selectedRows, setSelectedRows] = useState<LocationRow[]>([])
  const [resetSelectionKey, setResetSelectionKey] = useState(0)
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [jurisdictionFilter, setJurisdictionFilter] = useState('all')
  const [ownershipFilter, setOwnershipFilter] = useState('all')
  const [page, setPage] = useState(0)
  const [detailRow, setDetailRow] = useState<LocationRow | null>(null)

  const jurisdictionById = useMemo(
    () => new Map(JURISDICTIONS.map((j) => [j.id, j])),
    []
  )

  const rows = useMemo<LocationRow[]>(() => {
    // Platform Admin oversees all tenants; everyone else sees only what the
    // data layer would return for their company (LOC-02 / LOC-11).
    const base = isPlatformAdmin
      ? store.locations
      : store.visibleTo(CURRENT_COMPANY_ID)
    return base.map((l) => {
      const jurisdiction = jurisdictionById.get(l.jurisdictionId)
      const owned = isPlatformAdmin || l.companyId === CURRENT_COMPANY_ID
      const sharedTargets = store.activeTargetsOf(l.id)
      const ownership: Ownership = !owned
        ? 'referenced'
        : sharedTargets.length > 0
          ? 'shared-out'
          : 'owned'
      return {
        ...l,
        jurisdictionName: jurisdiction?.name ?? l.jurisdictionId,
        jurisdictionCountry: jurisdiction?.country ?? '',
        ownerName: store.companyName(l.companyId),
        ownership,
        sharedWith: sharedTargets.map(store.companyName).join(', '),
      }
    })
  }, [store, isPlatformAdmin, jurisdictionById])

  const filteredRows = useMemo(
    () =>
      rows.filter(
        (r) =>
          (jurisdictionFilter === 'all' || r.jurisdictionId === jurisdictionFilter) &&
          (ownershipFilter === 'all' ||
            (ownershipFilter === 'owned'
              ? r.ownership !== 'referenced'
              : r.ownership === 'referenced'))
      ),
    [rows, jurisdictionFilter, ownershipFilter]
  )

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const pagedRows = filteredRows.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE
  )

  useEffect(() => {
    setPage(0)
  }, [jurisdictionFilter, ownershipFilter])

  const clearSelection = () => {
    setSelectedRows([])
    setResetSelectionKey((prev) => prev + 1)
  }

  const editingLocation = editingId
    ? (store.locationById.get(editingId) ?? null)
    : null

  const handleEdit = () => {
    if (selectedRows.length !== 1) return
    const row = selectedRows[0]
    if (row.ownership === 'referenced') {
      // Ownership stays with the originating company (LOC-08 / LOC-09).
      toast.error(
        `Referenced location — only ${row.ownerName} (owner) can change it.`
      )
      return
    }
    setEditingId(row.id)
    setOverlayOpen(true)
  }

  const handleSubmit = (draft: LocationDraft) => {
    if (editingLocation) {
      store.updateLocation(editingLocation.id, draft)
    } else {
      store.addLocation(draft)
    }
    clearSelection()
  }

  const deletableSelection = selectedRows.filter((r) => r.ownership !== 'referenced')

  const onConfirmDelete = () => {
    deletableSelection.forEach((r) => store.deleteLocation(r.id))
    toast.success(
      deletableSelection.length === 1
        ? 'Location removed'
        : `${deletableSelection.length} locations removed`
    )
    setConfirmDelete(false)
    clearSelection()
  }

  return (
    <div className='w-full'>
      <LocationsSummary rows={rows} />

      <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
        <div className='flex items-center gap-2'>
          <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
            Locations ({filteredRows.length})
          </h2>
          <Select value={jurisdictionFilter} onValueChange={setJurisdictionFilter}>
            <SelectTrigger variant='secondary' className='h-7 w-[190px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All jurisdictions</SelectItem>
              {JURISDICTIONS.map((j) => (
                <SelectItem key={j.id} value={j.id}>
                  {j.name} — {j.country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={ownershipFilter} onValueChange={setOwnershipFilter}>
            <SelectTrigger variant='secondary' className='h-7 w-[170px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Owned & referenced</SelectItem>
              <SelectItem value='owned'>Owned only</SelectItem>
              <SelectItem value='referenced'>Referenced only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className='flex items-center gap-3'>
          <Button
            variant='icon2'
            onClick={store.refreshList}
            className='text-neutral-1900 h-7 w-7'
            aria-label='Refresh'
          >
            <ArrowsClockwise size={16} weight='bold' />
          </Button>
          {canManage && (
            <>
              <Button
                variant='icon2'
                onClick={handleEdit}
                className='text-neutral-1900 h-7 w-7'
                disabled={selectedRows.length !== 1}
                aria-label='Edit'
              >
                <PencilSimple size={16} weight='fill' />
              </Button>
              <Button
                variant='icon2'
                onClick={() => setConfirmDelete(true)}
                className='text-neutral-1900 h-7 w-7'
                disabled={deletableSelection.length === 0}
                aria-label='Delete'
              >
                <Trash size={16} weight='bold' />
              </Button>
              <Button
                variant='red'
                onClick={() => {
                  setEditingId(null)
                  setOverlayOpen(true)
                }}
                className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
              >
                <Plus size={10} weight='bold' />
                New Location
              </Button>
            </>
          )}
        </div>
      </div>

      <DataTable
        columns={locationsTableColumns}
        data={pagedRows}
        variant='no-status'
        resetSelectionKey={resetSelectionKey}
        onSelectionChange={(r) => setSelectedRows(r)}
        onRowClick={(row) => setDetailRow(row)}
      />

      <DetailSheet
        open={detailRow !== null}
        onOpenChange={(o) => !o && setDetailRow(null)}
        title={detailRow?.name ?? ''}
        description={detailRow?.acronym}
        sections={
          detailRow
            ? [
                {
                  title: 'Location',
                  fields: [
                    { label: 'Status', value: detailRow.status === 'active' ? 'Active' : 'Inactive' },
                    { label: 'Owner', value: detailRow.ownerName },
                    { label: 'Jurisdiction', value: `${detailRow.jurisdictionName} (${detailRow.jurisdictionCountry})` },
                    { label: 'Timezone', value: detailRow.timezone },
                    { label: 'Shared with', value: detailRow.sharedWith || '—' },
                    { label: 'Created on', value: detailRow.createdOn },
                  ],
                },
                {
                  title: 'Address & network',
                  fields: [
                    {
                      label: 'Address',
                      value: [detailRow.address1, detailRow.address2, detailRow.city, detailRow.state, detailRow.country, detailRow.pinCode]
                        .filter(Boolean)
                        .join(', '),
                    },
                    { label: 'IP address / range', value: detailRow.ipAddress || '—' },
                  ],
                },
              ]
            : []
        }
      />

      <div className='mt-2 flex items-center justify-between'>
        <span className='text-paragraph-sm text-neutral-1000'>
          Showing {pagedRows.length} of {filteredRows.length} locations
          {filteredRows.length !== rows.length ? ` (filtered from ${rows.length})` : ''}
        </span>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            className='h-7 px-2'
            disabled={safePage === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            aria-label='Previous page'
          >
            <CaretLeft size={14} />
          </Button>
          <span className='text-paragraph-sm text-neutral-1600'>
            Page {safePage + 1} of {pageCount}
          </span>
          <Button
            variant='outline'
            className='h-7 px-2'
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            aria-label='Next page'
          >
            <CaretRight size={14} />
          </Button>
        </div>
      </div>

      <LocationOverlay
        open={overlayOpen}
        onOpenChange={(open) => {
          setOverlayOpen(open)
          if (!open) setEditingId(null)
        }}
        location={editingLocation}
        onSubmit={handleSubmit}
        pinCodeFormat={org.pinCodeFormat}
      />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove {deletableSelection.length === 1 ? 'location' : 'locations'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deletableSelection.length === 1
                ? `${deletableSelection[0]?.name} and any sharing configuration for it will be removed.`
                : `${deletableSelection.length} owned locations and their sharing configuration will be removed.`}{' '}
              Referenced locations in your selection are skipped — ownership
              remains with the originating company.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirmDelete}
              className='bg-destructive hover:bg-destructive/90 text-white'
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
