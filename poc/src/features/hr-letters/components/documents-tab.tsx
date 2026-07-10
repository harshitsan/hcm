import { useMemo, useState } from 'react'
import { Eye, Lightning, Plus } from 'phosphor-react'
import { toast } from 'sonner'
import { useRole } from '@/context/role-context'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable } from '@/components/common/data-table/table'
import {
  EMPLOYEES,
  EVENT_DOC_TYPE,
  WORKFLOW_EVENTS,
  type DocStatus,
  type HrDocument,
  type LetterTemplate,
  type WorkflowEvent,
} from '../data/hr-letters'
import { type HrDocumentsStore } from '../hooks/use-hr-documents'
import { type LetterConfigStore } from '../hooks/use-letter-config'
import { DocumentDetailSheet } from './document-detail-sheet'
import { documentsTableColumns } from './documents-table-columns'
import { GenerateOverlay } from './generate-overlay'
import { LettersSummary } from './letters-summary'

const STATUS_FILTERS: Array<{ value: DocStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending-approval', label: 'Pending approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'distributed', label: 'Distributed' },
]

interface DocumentsTabProps {
  store: HrDocumentsStore
  templates: LetterTemplate[]
  config: LetterConfigStore
}

/**
 * Search/filter grid over all generated documents (HLC-22) with manual +
 * batch generation (HLC-03/05), workflow-event simulation for auto-generation
 * (HLC-04), and a drill-in sheet exposing versions, approval, signing
 * authority, and distribution tracking. Generation actions are Company Admin
 * only; other admin roles browse read-only within their scope.
 */
export function DocumentsTab({ store, templates, config }: DocumentsTabProps) {
  const { role } = useRole()
  const isCompanyAdmin = role === 'Company Admin'

  const [selectedRows, setSelectedRows] = useState<HrDocument[]>([])
  const [resetSelectionKey, setResetSelectionKey] = useState(0)
  const [generateOpen, setGenerateOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<DocStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const docTypes = useMemo(
    () => Array.from(new Set(store.documents.map((d) => d.docType))),
    [store.documents]
  )

  const filtered = useMemo(
    () =>
      store.documents.filter(
        (d) =>
          (statusFilter === 'all' || d.status === statusFilter) &&
          (typeFilter === 'all' || d.docType === typeFilter)
      ),
    [store.documents, statusFilter, typeFilter]
  )

  const detailDoc = store.documents.find((d) => d.id === detailId) ?? null

  const clearSelection = () => {
    setSelectedRows([])
    setResetSelectionKey((prev) => prev + 1)
  }

  const handleGenerate = (template: LetterTemplate, employeeIds: string[]) => {
    const employees = EMPLOYEES.filter((e) => employeeIds.includes(e.id))
    store.generate(
      template,
      employees,
      employees.length > 1 ? 'batch' : 'manual',
      'On request',
      'Lakshmi Rao (Company Admin)'
    )
    clearSelection()
  }

  const simulateEvent = (event: WorkflowEvent) => {
    if (!config.settings.autoTriggers[event]) {
      toast.info(`Auto-generation for "${event}" is disabled in configuration`)
      return
    }
    const docType = EVENT_DOC_TYPE[event]
    const template = templates.find((t) => t.docType === docType)
    if (!template) {
      toast.error(`No template configured for ${docType}`)
      return
    }
    const employee = EMPLOYEES[Math.floor(Math.random() * 5)]
    store.generate(template, [employee], 'auto', event, 'Workflow engine')
  }

  return (
    <div className='w-full'>
      <LettersSummary documents={store.documents} />

      <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          Generated documents ({filtered.length})
        </h2>
        <div className='flex flex-wrap items-center gap-3'>
          <Select
            value={typeFilter}
            onValueChange={(value) => setTypeFilter(value)}
          >
            <SelectTrigger variant='secondary' className='h-7 w-[190px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All document types</SelectItem>
              {docTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as DocStatus | 'all')}
          >
            <SelectTrigger variant='secondary' className='h-7 w-[160px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant='icon2'
            className='text-neutral-1900 h-7 w-7'
            aria-label='View details'
            disabled={selectedRows.length !== 1}
            onClick={() => setDetailId(selectedRows[0]?.id ?? null)}
          >
            <Eye size={16} weight='bold' />
          </Button>
          {isCompanyAdmin && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='icon2'
                    className='text-neutral-1900 h-7 w-7'
                    aria-label='Simulate workflow event'
                  >
                    <Lightning size={16} weight='bold' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='min-w-[220px]'>
                  {WORKFLOW_EVENTS.map((event) => (
                    <DropdownMenuItem
                      key={event}
                      onClick={() => simulateEvent(event)}
                    >
                      Simulate {event} event → {EVENT_DOC_TYPE[event]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant='red'
                onClick={() => setGenerateOpen(true)}
                className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
              >
                <Plus size={10} weight='bold' />
                Generate
              </Button>
            </>
          )}
        </div>
      </div>

      <DataTable
        columns={documentsTableColumns}
        data={filtered}
        variant='no-status'
        resetSelectionKey={resetSelectionKey}
        onSelectionChange={(rows) => setSelectedRows(rows)}
      />

      <GenerateOverlay
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        templates={templates}
        documents={store.documents}
        onGenerate={handleGenerate}
      />

      <DocumentDetailSheet
        doc={detailDoc}
        onOpenChange={(open) => {
          if (!open) {
            setDetailId(null)
            clearSelection()
          }
        }}
        store={store}
        templates={templates}
        canAct={isCompanyAdmin}
      />
    </div>
  )
}
