import { useMemo, useState } from 'react'
import { DownloadSimple, PencilSimple, Plus, Trash } from 'phosphor-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable } from '@/components/common/data-table/table'
import {
  ENTITY_TYPES,
  expiryStatusOf,
  type ExpiryStatus,
} from '../data/documents'
import { type DocumentType } from '../data/masters'
import { companiesForRole, CURRENT_ADMIN } from '../data/org'
import { type DocumentReceipt } from '../data/receipts'
import { type DocumentsStore } from '../hooks/use-documents'
import { type DocumentSettingsStore } from '../hooks/use-document-settings'
import { DocumentDetailSheet } from './document-detail-sheet'
import { documentsTableColumns, type DocumentRow } from './documents-table-columns'
import { DocumentsSummary } from './documents-summary'
import { UploadOverlay } from './upload-overlay'

interface DocumentsTabProps {
  store: DocumentsStore
  settings: DocumentSettingsStore
  documentTypes: DocumentType[]
  /** Custodian receipts — surfaced as custody history in the detail sheet. */
  receipts: DocumentReceipt[]
}

const EXPIRY_FILTERS: { value: ExpiryStatus | 'All'; label: string }[] = [
  { value: 'All', label: 'All expiry statuses' },
  { value: 'expiring', label: 'Expiring soon' },
  { value: 'expired', label: 'Expired' },
  { value: 'active', label: 'Valid' },
  { value: 'none', label: 'No expiry' },
]

/**
 * The documents grid (DOC-22): tenant-scoped per role (DOC-01/02/03/14/15),
 * filtered by the role-based access matrix (DOC-09), with category / entity /
 * expiry filters (DOC-08/13), sortable metadata columns (DOC-06), and
 * upload / edit / delete / download actions gated by role.
 */
export function DocumentsTab({
  store,
  settings,
  documentTypes,
  receipts,
}: DocumentsTabProps) {
  const { role } = useRole()
  const [selectedRows, setSelectedRows] = useState<DocumentRow[]>([])
  const [resetSelectionKey, setResetSelectionKey] = useState(0)
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [category, setCategory] = useState('All')
  const [entityType, setEntityType] = useState('All')
  const [expiry, setExpiry] = useState<ExpiryStatus | 'All'>('All')

  const scopeCompanies = useMemo(() => companiesForRole(role), [role])

  // Portfolio Admin has oversight visibility only (DOC-15); other admins manage.
  const canManage = role !== 'Portfolio Admin' && role !== 'Employee (Non-User)'

  const rows = useMemo<DocumentRow[]>(() => {
    return store.documents
      .filter(
        (d) =>
          scopeCompanies.includes(d.company) && settings.canView(role, d.category)
      )
      .filter((d) => category === 'All' || d.category === category)
      .filter((d) => entityType === 'All' || d.entityType === entityType)
      .map((d) => ({
        ...d,
        expiryStatus: expiryStatusOf(d.expiryDate, settings.leadTimeDays),
      }))
      .filter((d) => expiry === 'All' || d.expiryStatus === expiry)
  }, [store.documents, scopeCompanies, settings, role, category, entityType, expiry])

  const clearSelection = () => {
    setSelectedRows([])
    setResetSelectionKey((prev) => prev + 1)
  }

  const single = selectedRows.length === 1 ? selectedRows[0] : null
  const editingDoc = editingId
    ? (store.documents.find((d) => d.id === editingId) ?? null)
    : null
  const detailDoc = detailId
    ? (rows.find((d) => d.id === detailId) ?? null)
    : null

  const handleDownload = () => {
    if (!single) return
    if (!settings.canDownload(role, single.category)) {
      toast.error(
        `Your role has no download permission for the "${single.category}" category`
      )
      return
    }
    toast.success(`Downloading ${single.fileName} (decrypted for your tenant)`)
  }

  const onConfirmDelete = () => {
    const count = selectedRows.length
    selectedRows.forEach((d) => store.deleteDocument(d.id))
    toast.success(count === 1 ? 'Document removed' : `${count} documents removed`)
    setConfirmDelete(false)
    clearSelection()
  }

  const resetFilters = () => {
    setCategory('All')
    setEntityType('All')
    setExpiry('All')
  }

  return (
    <div className='w-full'>
      <DocumentsSummary
        documents={rows}
        leadTimeDays={settings.leadTimeDays}
      />

      <div className='mb-3 flex flex-wrap items-center gap-2'>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger variant='secondary' className='h-7 w-[180px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='All'>All categories</SelectItem>
            {settings.activeCategories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={entityType} onValueChange={setEntityType}>
          <SelectTrigger variant='secondary' className='h-7 w-[160px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='All'>All entities</SelectItem>
            {ENTITY_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={expiry}
          onValueChange={(v) => setExpiry(v as ExpiryStatus | 'All')}
        >
          <SelectTrigger variant='secondary' className='h-7 w-[180px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EXPIRY_FILTERS.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant='outline' className='h-7 px-2' onClick={resetFilters}>
          Reset
        </Button>
        <span className='text-paragraph-sm text-neutral-1000 ml-auto'>
          Tenant scope: {scopeCompanies.length}{' '}
          {scopeCompanies.length === 1 ? 'company' : 'companies'} ({role})
        </span>
      </div>

      <div className='mb-3 flex items-center justify-between'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          Documents ({rows.length})
        </h2>
        <div className='flex items-center gap-3'>
          <Button
            variant='icon2'
            onClick={handleDownload}
            className='text-neutral-1900 h-7 w-7'
            disabled={!single}
            aria-label='Download'
          >
            <DownloadSimple size={16} weight='bold' />
          </Button>
          {canManage && (
            <>
              <Button
                variant='icon2'
                onClick={() => {
                  if (!single) return
                  setEditingId(single.id)
                  setOverlayOpen(true)
                }}
                className='text-neutral-1900 h-7 w-7'
                disabled={!single || !settings.canUpload(role, single.category)}
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
                  setEditingId(null)
                  setOverlayOpen(true)
                }}
                className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
              >
                <Plus size={10} weight='bold' />
                Upload Document
              </Button>
            </>
          )}
        </div>
      </div>

      <DataTable
        columns={documentsTableColumns}
        data={rows}
        variant='no-status'
        resetSelectionKey={resetSelectionKey}
        onSelectionChange={(selected) => setSelectedRows(selected)}
        onRowClick={(row) => setDetailId(row.id)}
      />

      <DocumentDetailSheet
        document={detailDoc}
        onOpenChange={(open) => {
          if (!open) setDetailId(null)
        }}
        settings={settings}
        receipts={receipts}
      />

      <UploadOverlay
        open={overlayOpen}
        onOpenChange={(open) => {
          setOverlayOpen(open)
          if (!open) setEditingId(null)
        }}
        document={editingDoc}
        settings={settings}
        documentTypes={documentTypes}
        companies={scopeCompanies}
        onSubmit={(draft) => {
          if (editingDoc) {
            store.updateDocument(editingDoc.id, draft)
            toast.success(`${draft.name} updated`)
          } else {
            store.addDocument(draft, CURRENT_ADMIN)
            toast.success(
              `${draft.name} stored — encrypted at rest within your tenant`
            )
          }
          clearSelection()
        }}
      />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove {selectedRows.length === 1 ? 'document' : 'documents'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedRows.length === 1
                ? `${selectedRows[0]?.name} will be removed from its entity record.`
                : `${selectedRows.length} documents will be removed from their entity records.`}{' '}
              This can’t be undone.
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
