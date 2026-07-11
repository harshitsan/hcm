import { useMemo, useState } from 'react'
import { Eye, EyeSlash, PencilSimple, Plus, Trash } from 'phosphor-react'
import { toast } from 'sonner'
import { useRole } from '@/context/role-context'
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
import { type Announcement } from '../data/announcements'
import { companiesForRole, CURRENT_ADMIN, type OrgConfig } from '../data/org'
import { type AnnouncementsStore } from '../hooks/use-announcements'
import { AnnouncementDetailSheet } from './announcement-detail-sheet'
import {
  AnnouncementFiltersBar,
  EMPTY_FILTERS,
  type AnnouncementFilters,
} from './announcement-filters'
import { announcementsTableColumns } from './announcements-table-columns'
import { AnnouncementsSummary } from './announcements-summary'
import { ComposeOverlay } from './compose-overlay'

interface ManageTabProps {
  store: AnnouncementsStore
  orgConfig: OrgConfig
}

/**
 * Admin management surface: paginated list with the Kensium columns (ANN-36),
 * instant period/status filters (ANN-34/35), compose/edit overlay, delete
 * with confirm (ANN-38), hide/unhide (ANN-39), and a row-click detail sheet
 * carrying the history timeline and the full approval workflow with a
 * mandatory decision comment (ANN-24..29). Records are tenant-scoped to the
 * caller's authorization boundary, mirroring row-level security (ANN-15).
 */
export function ManageTab({ store, orgConfig }: ManageTabProps) {
  const { role } = useRole()
  const [selectedRows, setSelectedRows] = useState<Announcement[]>([])
  const [resetSelectionKey, setResetSelectionKey] = useState(0)
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [editing, setEditing] = useState<Announcement | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [filters, setFilters] = useState<AnnouncementFilters>(EMPTY_FILTERS)
  const [detailId, setDetailId] = useState<string | null>(null)

  const scoped = useMemo(() => {
    if (role === 'Platform Admin') return store.announcements
    const allowed = companiesForRole(role)
    return store.announcements.filter(
      (a) => a.tenant !== 'Platform' && allowed.includes(a.tenant)
    )
  }, [store.announcements, role])

  const filtered = useMemo(() => {
    return scoped.filter((a) => {
      if (filters.from && a.startDate < filters.from) return false
      if (filters.to && a.startDate > filters.to) return false
      if (filters.status !== 'All' && a.status !== filters.status) return false
      if (
        filters.pendingWithMe &&
        !(a.status === 'Pending approval' && a.pendingWith === CURRENT_ADMIN)
      )
        return false
      return true
    })
  }, [scoped, filters])

  const clearSelection = () => {
    setSelectedRows([])
    setResetSelectionKey((prev) => prev + 1)
  }

  const single = selectedRows.length === 1 ? selectedRows[0] : null
  const singleLive = single
    ? (store.announcements.find((a) => a.id === single.id) ?? null)
    : null
  const detailLive = detailId
    ? (store.announcements.find((a) => a.id === detailId) ?? null)
    : null

  const handleEdit = () => {
    if (!singleLive) return
    setEditing(singleLive)
    setOverlayOpen(true)
  }

  const onConfirmDelete = () => {
    const count = selectedRows.length
    selectedRows.forEach((a) => store.deleteAnnouncement(a.id))
    toast.success(
      count === 1
        ? 'Announcement deleted — audit history retained per retention rules'
        : `${count} announcements deleted — audit history retained per retention rules`
    )
    setConfirmDelete(false)
    clearSelection()
  }

  return (
    <div className='w-full'>
      <AnnouncementsSummary announcements={scoped} />

      <AnnouncementFiltersBar value={filters} onChange={setFilters} />

      <div className='mb-3 flex items-center justify-between'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          Announcements ({filtered.length})
        </h2>
        <div className='flex items-center gap-3'>
          <Button
            variant='icon2'
            onClick={() => {
              if (!singleLive) return
              store.toggleHidden(singleLive.id)
              clearSelection()
            }}
            className='text-neutral-1900 h-7 w-7'
            disabled={!singleLive}
            aria-label={singleLive?.hidden ? 'Unhide' : 'Hide'}
          >
            {singleLive?.hidden ? (
              <Eye size={16} weight='bold' />
            ) : (
              <EyeSlash size={16} weight='bold' />
            )}
          </Button>
          <Button
            variant='icon2'
            onClick={handleEdit}
            className='text-neutral-1900 h-7 w-7'
            disabled={!singleLive}
            aria-label='Edit'
          >
            <PencilSimple size={16} weight='fill' />
          </Button>
          <Button
            variant='icon2'
            onClick={() => setConfirmDelete(true)}
            className='text-neutral-1900 h-7 w-7'
            disabled={selectedRows.length === 0}
            aria-label='Delete'
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
            New Announcement
          </Button>
        </div>
      </div>

      <DataTable
        columns={announcementsTableColumns}
        data={filtered}
        variant='no-status'
        resetSelectionKey={resetSelectionKey}
        onSelectionChange={(rows) => setSelectedRows(rows)}
        onRowClick={(row) => setDetailId(row.id)}
      />

      <AnnouncementDetailSheet
        open={Boolean(detailLive)}
        onOpenChange={(open) => {
          if (!open) setDetailId(null)
        }}
        announcement={detailLive}
        store={store}
      />

      <ComposeOverlay
        open={overlayOpen}
        onOpenChange={(open) => {
          setOverlayOpen(open)
          if (!open) setEditing(null)
        }}
        announcement={editing}
        orgConfig={orgConfig}
        onCreate={(draft, intent) => {
          store.addAnnouncement(draft, intent)
          clearSelection()
        }}
        onUpdate={(id, draft) => {
          store.updateAnnouncement(id, draft)
          clearSelection()
        }}
      />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedRows.length === 1 ? 'announcement' : 'announcements'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedRows.length === 1
                ? `“${selectedRows[0]?.title}” will be removed and no longer visible to any audience.`
                : `${selectedRows.length} announcements will be removed and no longer visible to any audience.`}{' '}
              Audit history is retained per retention rules.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirmDelete}
              className='bg-destructive hover:bg-destructive/90 text-white'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
