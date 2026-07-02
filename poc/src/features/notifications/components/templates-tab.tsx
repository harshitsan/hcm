import { useMemo, useState } from 'react'
import { Eye, PencilLine, RefreshCcw, RotateCcw } from 'lucide-react'
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
}

/**
 * Pre-built HR-domain template library (NTF-25/26) with paired Email vs
 * In-app tabs (NTF-27), per-domain filtering, View/Refresh, the branded
 * editor (NTF-10/11/24) and group/company override handling (NTF-15).
 */
export function TemplatesTab({
  templates,
  saveTemplate,
  restoreDefault,
  overrideAtCompany,
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

  const clearSelection = () => {
    setSelectedRows([])
    setResetSelectionKey((prev) => prev + 1)
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
              clearSelection()
            }}
          >
            <TabsList>
              <TabsTrigger value='email' variant='primary'>
                Email Templates
              </TabsTrigger>
              <TabsTrigger value='in-app' variant='primary'>
                Notification Templates
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Select value={domainFilter} onValueChange={setDomainFilter}>
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
        data={filtered}
        variant='no-status'
        resetSelectionKey={resetSelectionKey}
        onSelectionChange={(rows) => setSelectedRows(rows)}
      />

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
