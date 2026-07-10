import { useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  PencilLine,
  RefreshCcw,
  RotateCcw,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataTable } from '@/components/common/data-table/table'
import { RoleGate, useRole } from '@/context/role-context'
import {
  TEMPLATE_DOMAINS,
  currentVersion,
  renderWithSamples,
  type NotificationTemplate,
  type TemplateChannel,
} from '../data/templates'
import { type TemplateDraft } from '../hooks/use-templates'
import { TemplateEditorOverlay } from './template-editor-overlay'
import { templatesTableColumns } from './templates-table-columns'

interface TemplatesTabProps {
  templates: NotificationTemplate[]
  saveTemplate: (id: string, draft: TemplateDraft) => void
  restoreDefault: (id: string) => void
  overrideAtCompany: (id: string) => void
  /** Cancel out of the templates screen back to the previous page (AET-05/FIN-04/PET-06/RET-05). */
  onCancel: () => void
}

const PAGE_SIZES = [5, 10, 25] as const

/**
 * Pre-built HR-domain template library (NTF-25/26) with paired Email vs
 * In-app tabs (NTF-27), per-domain filtering, View/Refresh, the branded
 * editor (NTF-10/11/24), group/company override handling (NTF-15), a pager
 * over the full library (PET-03/NT-03/PNT-03) and an explicit Cancel back to
 * the previous page (AET-05/FIN-04/PET-06/RET-05).
 */
export function TemplatesTab({
  templates,
  saveTemplate,
  restoreDefault,
  overrideAtCompany,
  onCancel,
}: TemplatesTabProps) {
  const { hasRole } = useRole()
  const [channel, setChannel] = useState<TemplateChannel>('email')
  const [domainFilter, setDomainFilter] = useState<string>('all')
  const [selectedRows, setSelectedRows] = useState<NotificationTemplate[]>([])
  const [resetSelectionKey, setResetSelectionKey] = useState(0)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] =
    useState<NotificationTemplate | null>(null)
  const [viewing, setViewing] = useState<NotificationTemplate | null>(null)
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState<number>(10)

  const canEdit = hasRole('Company Admin', 'Group Company Admin', 'Portfolio Admin')

  const filtered = useMemo(
    () =>
      templates.filter(
        (t) =>
          t.channel === channel &&
          (domainFilter === 'all' || t.domain === domainFilter)
      ),
    [templates, channel, domainFilter]
  )

  // Pager over the full library (PET-03/NT-03/PNT-03): clamp the page when
  // the filter shrinks the list, then slice the current page for the table.
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(pageIndex, pageCount - 1)
  const paged = useMemo(
    () => filtered.slice(safePage * pageSize, (safePage + 1) * pageSize),
    [filtered, safePage, pageSize]
  )
  const rangeStart = filtered.length === 0 ? 0 : safePage * pageSize + 1
  const rangeEnd = Math.min((safePage + 1) * pageSize, filtered.length)

  const clearSelection = () => {
    setSelectedRows([])
    setResetSelectionKey((prev) => prev + 1)
  }

  const goToPage = (next: number) => {
    setPageIndex(Math.min(Math.max(next, 0), pageCount - 1))
    clearSelection()
  }

  const selected = selectedRows[0]

  const handleEdit = () => {
    if (!selected) return
    const live = templates.find((t) => t.id === selected.id) ?? selected
    setEditingTemplate(live)
    setEditorOpen(true)
  }

  const handleView = () => {
    if (!selected) return
    setViewing(templates.find((t) => t.id === selected.id) ?? selected)
  }

  return (
    <div className='w-full'>
      <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
        <div className='flex items-center gap-3'>
          {/* Paired email / in-app templates per event (NTF-27) */}
          <Tabs
            value={channel}
            onValueChange={(v) => {
              setChannel(v as TemplateChannel)
              setPageIndex(0)
              clearSelection()
            }}
          >
            <TabsList className='bg-transparent p-0 h-auto justify-start gap-2 rounded-none'>
              <TabsTrigger value='email' variant='primary'>
                Email Templates
              </TabsTrigger>
              <TabsTrigger value='in-app' variant='primary'>
                Notification Templates
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Select
            value={domainFilter}
            onValueChange={(v) => {
              setDomainFilter(v)
              setPageIndex(0)
              clearSelection()
            }}
          >
            <SelectTrigger variant='secondary' className='h-7 w-[230px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All HR domains</SelectItem>
              {TEMPLATE_DOMAINS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='flex items-center gap-2'>
          {/* Explicit Cancel back to the previous page (AET-05/FIN-04/PET-06/RET-05) */}
          <Button
            variant='outline'
            className='h-7 gap-1 rounded-[6px] px-2'
            onClick={() => {
              clearSelection()
              onCancel()
            }}
          >
            <X className='size-3.5' />
            Cancel
          </Button>
          <Button
            variant='icon2'
            className='text-neutral-1900 h-7 w-7'
            aria-label='Refresh'
            onClick={() => {
              clearSelection()
              toast.success('Template list refreshed with the latest saved templates.')
            }}
          >
            <RefreshCcw className='size-4' />
          </Button>
          <Button
            variant='outline'
            className='h-7 gap-1 rounded-[6px] px-2'
            disabled={!selected}
            onClick={handleView}
          >
            <Eye className='size-3.5' />
            View
          </Button>
          <RoleGate roles={['Company Admin', 'Group Company Admin', 'Portfolio Admin']}>
            <Button
              variant='outline'
              className='h-7 gap-1 rounded-[6px] px-2'
              disabled={!selected || !selected.customized}
              onClick={() => {
                if (selected) restoreDefault(selected.id)
                clearSelection()
              }}
            >
              <RotateCcw className='size-3.5' />
              Restore default
            </Button>
          </RoleGate>
          <RoleGate roles={['Company Admin']}>
            <Button
              variant='outline'
              className='h-7 rounded-[6px] px-2'
              disabled={!selected || selected.level === 'Company'}
              onClick={() => {
                if (selected) overrideAtCompany(selected.id)
                clearSelection()
              }}
            >
              Override for my company
            </Button>
          </RoleGate>
          {canEdit && (
            <Button
              className='h-7 gap-1 rounded-[6px] px-2'
              disabled={!selected}
              onClick={handleEdit}
            >
              <PencilLine className='size-3.5' />
              Edit template
            </Button>
          )}
        </div>
      </div>

      <p className='text-paragraph-sm text-neutral-1000 mb-2'>
        {filtered.length} template(s) · seeded per HR domain on company
        provisioning — recruitment/onboarding, asset, finance, travel,
        timesheet, performance, survey, training, resource management and
        feedback/grievance ship ready to tailor.
      </p>

      <DataTable
        columns={templatesTableColumns}
        data={paged}
        variant='no-status'
        resetSelectionKey={resetSelectionKey}
        onSelectionChange={(rows) => setSelectedRows(rows)}
      />

      {/* Pager so long libraries stay browsable (PET-03/NT-03/PNT-03) */}
      <div className='mt-2 flex flex-wrap items-center justify-between gap-2'>
        <p className='text-paragraph-sm text-neutral-1000'>
          Showing {rangeStart}–{rangeEnd} of {filtered.length} template(s)
        </p>
        <div className='flex items-center gap-2'>
          <span className='text-paragraph-sm text-neutral-1000'>
            Rows per page
          </span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => {
              setPageSize(Number(v))
              setPageIndex(0)
              clearSelection()
            }}
          >
            <SelectTrigger variant='secondary' className='h-7 w-[70px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant='outline'
            className='h-7 gap-1 rounded-[6px] px-2'
            disabled={safePage === 0}
            onClick={() => goToPage(safePage - 1)}
          >
            <ChevronLeft className='size-3.5' />
            Previous
          </Button>
          <span className='text-paragraph-sm text-neutral-1000'>
            Page {safePage + 1} of {pageCount}
          </span>
          <Button
            variant='outline'
            className='h-7 gap-1 rounded-[6px] px-2'
            disabled={safePage >= pageCount - 1}
            onClick={() => goToPage(safePage + 1)}
          >
            Next
            <ChevronRight className='size-3.5' />
          </Button>
        </div>
      </div>

      <TemplateEditorOverlay
        open={editorOpen}
        onOpenChange={(open) => {
          setEditorOpen(open)
          if (!open) {
            setEditingTemplate(null)
            clearSelection()
          }
        }}
        template={editingTemplate}
        onSubmit={saveTemplate}
      />

      <Dialog open={viewing !== null} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className='max-w-[560px]'>
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {viewing.id} — {viewing.event}
                </DialogTitle>
                <DialogDescription>
                  {viewing.domain} ·{' '}
                  {viewing.channel === 'email' ? 'Email' : 'In-app notification'}{' '}
                  · v{currentVersion(viewing).version} effective{' '}
                  {currentVersion(viewing).effectiveFrom}
                </DialogDescription>
              </DialogHeader>
              <div className='space-y-2'>
                <div className='flex items-center gap-2'>
                  <Badge variant='pending'>
                    {currentVersion(viewing).brandColor}
                  </Badge>
                  <Badge
                    variant={viewing.customized ? 'badge_active' : 'badge_inactive'}
                  >
                    {viewing.customized ? 'Customized' : 'Seeded'}
                  </Badge>
                  <Badge variant='open'>{viewing.level} level</Badge>
                </div>
                <p className='text-neutral-1600 text-sm font-semibold'>
                  {renderWithSamples(currentVersion(viewing).subject)}
                </p>
                <p className='text-neutral-1000 text-sm whitespace-pre-wrap'>
                  {renderWithSamples(currentVersion(viewing).body)}
                </p>
                <p className='text-paragraph-sm text-neutral-1000'>
                  Rendered with sample data — unresolved placeholders degrade
                  gracefully as “—” without breaking delivery.
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
