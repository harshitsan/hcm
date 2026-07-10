import { useMemo, useState } from 'react'
import { ArrowClockwise, CaretLeft, CaretRight, Eye, PencilSimple } from 'phosphor-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { type AttendanceTemplate, type TemplateChannel } from '../data/config'
import { type AttendanceConfigStore } from '../hooks/use-attendance-config'

const PAGE_SIZE = 5

/**
 * Attendance email & notification templates (Kensium ET/NT): browsable,
 * paginated lists showing template type and description, a per-template
 * detail view, inline editing of subject/body, and refresh.
 */
export function ConfigTemplates({ config }: { config: AttendanceConfigStore }) {
  const [viewing, setViewing] = useState<AttendanceTemplate | null>(null)
  const [editing, setEditing] = useState<AttendanceTemplate | null>(null)
  const [eName, setEName] = useState('')
  const [eDescription, setEDescription] = useState('')
  const [eSubject, setESubject] = useState('')
  const [eBody, setEBody] = useState('')

  const openEdit = (t: AttendanceTemplate) => {
    setEditing(t)
    setEName(t.name)
    setEDescription(t.description)
    setESubject(t.subject ?? '')
    setEBody(t.body)
  }

  const saveEdit = () => {
    if (!editing) return
    if (!eName.trim() || !eBody.trim()) {
      toast.error('Template name and body are required')
      return
    }
    config.updateTemplate(editing.id, {
      name: eName,
      description: eDescription,
      subject: editing.channel === 'email' ? eSubject : null,
      body: eBody,
    })
    setEditing(null)
  }

  return (
    <div className='w-full space-y-5'>
      <TemplateList
        channel='email'
        title='Email Templates'
        subtitle='email notifications the attendance engine sends'
        config={config}
        onView={setViewing}
        onEdit={openEdit}
      />
      <TemplateList
        channel='notification'
        title='Notification Templates'
        subtitle='in-app notifications raised by attendance events'
        config={config}
        onView={setViewing}
        onEdit={openEdit}
      />

      {/* Detail view (ET-02 / NT-02) */}
      <Dialog open={viewing !== null} onOpenChange={(v) => !v && setViewing(null)}>
        <DialogContent className='sm:max-w-[480px]'>
          <DialogHeader>
            <DialogTitle>{viewing?.name}</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className='space-y-3 text-sm'>
              <p>
                <Badge variant='open'>{viewing.templateType}</Badge>
                <span className='text-neutral-1000 ml-2 text-xs capitalize'>
                  {viewing.channel} template
                </span>
              </p>
              <p className='text-paragraph-sm text-neutral-1000'>{viewing.description}</p>
              {viewing.subject !== null && (
                <div>
                  <Label className='text-xs'>Subject</Label>
                  <p className='rounded-[6px] border border-gray-200 px-3 py-2'>
                    {viewing.subject}
                  </p>
                </div>
              )}
              <div>
                <Label className='text-xs'>Body</Label>
                <p className='rounded-[6px] border border-gray-200 px-3 py-2 whitespace-pre-wrap'>
                  {viewing.body}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant='outline' onClick={() => setViewing(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit template */}
      <Dialog open={editing !== null} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className='sm:max-w-[480px]'>
          <DialogHeader>
            <DialogTitle>Edit template</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='flex flex-col gap-1'>
              <Label className='text-xs'>Template name</Label>
              <Input value={eName} onChange={(e) => setEName(e.target.value)} />
            </div>
            <div className='flex flex-col gap-1'>
              <Label className='text-xs'>Description</Label>
              <Input value={eDescription} onChange={(e) => setEDescription(e.target.value)} />
            </div>
            {editing?.channel === 'email' && (
              <div className='flex flex-col gap-1'>
                <Label className='text-xs'>Subject</Label>
                <Input value={eSubject} onChange={(e) => setESubject(e.target.value)} />
              </div>
            )}
            <div className='flex flex-col gap-1'>
              <Label className='text-xs'>Body (placeholders like {'{{employeeName}}'} are merged when sent)</Label>
              <Textarea rows={6} value={eBody} onChange={(e) => setEBody(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={saveEdit}>Save Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TemplateList({
  channel,
  title,
  subtitle,
  config,
  onView,
  onEdit,
}: {
  channel: TemplateChannel
  title: string
  subtitle: string
  config: AttendanceConfigStore
  onView: (t: AttendanceTemplate) => void
  onEdit: (t: AttendanceTemplate) => void
}) {
  const [page, setPage] = useState(0)

  const templates = useMemo(
    () => config.templates.filter((t) => t.channel === channel),
    [config.templates, channel]
  )
  const pageCount = Math.max(1, Math.ceil(templates.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const visible = templates.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)

  return (
    <div>
      <div className='mb-2 flex flex-wrap items-center justify-between gap-2'>
        <h3 className='text-neutral-1600 text-sm font-medium'>
          {title} ({templates.length})
          <span className='text-neutral-1000 ml-2 text-xs'>{subtitle}</span>
        </h3>
        <Button
          variant='outline'
          className='h-7 gap-1'
          onClick={() => config.refreshTemplates(channel)}
        >
          <ArrowClockwise size={12} weight='bold' />
          Refresh
        </Button>
      </div>
      <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='text-neutral-1000 border-b text-left text-xs'>
              <th className='py-2 pr-3 font-medium'>Template</th>
              <th className='px-2 font-medium'>Type</th>
              <th className='px-2 font-medium'>Description</th>
              <th className='px-2 text-right font-medium'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((t) => (
              <tr key={t.id} className='border-b last:border-0'>
                <td className='py-2 pr-3 font-medium'>{t.name}</td>
                <td className='px-2'>
                  <Badge variant='open'>{t.templateType}</Badge>
                </td>
                <td className='px-2'>{t.description}</td>
                <td className='px-2 text-right'>
                  <div className='flex justify-end gap-1'>
                    <Button
                      variant='outline'
                      className='h-6 gap-1 px-2 text-xs'
                      onClick={() => onView(t)}
                    >
                      <Eye size={12} />
                      View
                    </Button>
                    <Button
                      variant='outline'
                      className='h-6 gap-1 px-2 text-xs'
                      onClick={() => onEdit(t)}
                    >
                      <PencilSimple size={12} />
                      Edit
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className='mt-2 flex items-center justify-end gap-2 border-t border-gray-100 pt-2'>
          <span className='text-neutral-1000 text-xs'>
            Page {safePage + 1} of {pageCount}
          </span>
          <Button
            variant='outline'
            className='h-6 px-2'
            disabled={safePage === 0}
            onClick={() => setPage(safePage - 1)}
            aria-label='Previous page'
          >
            <CaretLeft size={12} />
          </Button>
          <Button
            variant='outline'
            className='h-6 px-2'
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage(safePage + 1)}
            aria-label='Next page'
          >
            <CaretRight size={12} />
          </Button>
        </div>
      </div>
    </div>
  )
}
