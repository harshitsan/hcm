import { useState } from 'react'
import { PencilSimple, Plus, Trash } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  SimpleTable,
  sortableColumnHeader,
} from '@/components/common/data-table/simple-table'
import { Textarea } from '@/components/ui/textarea'
import type { ColumnDef } from '@tanstack/react-table'
import {
  FEEDBACK_TYPES,
  type ClientFeedbackDraft,
  type ClientFeedbackEntry,
  type FeedbackType,
} from '../../data/profile-extras'
import { type ProfileExtrasStore } from '../../hooks/use-profile-extras'
import { SectionTitle } from '../shared'

const FEEDBACK_BADGES: Record<
  FeedbackType,
  'badge_active' | 'dropped' | 'pending'
> = {
  Positive: 'badge_active',
  Negative: 'dropped',
  Neutral: 'pending',
}

const emptyDraft: ClientFeedbackDraft = {
  clientName: '',
  projectName: '',
  feedbackDate: '',
  subject: '',
  feedbackType: 'Positive',
  documentName: '',
  feedbackText: '',
}

/** Kensium profile parity — Client Feedback tab: project feedback log. */
export function ClientFeedbackSection({
  store,
}: {
  store: ProfileExtrasStore
}) {
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<ClientFeedbackDraft>(emptyDraft)

  const set = (patch: Partial<ClientFeedbackDraft>) =>
    setDraft((d) => ({ ...d, ...patch }))

  const openNew = () => {
    setEditingId(null)
    setDraft(emptyDraft)
    setOpen(true)
  }

  const openEdit = (entry: ClientFeedbackEntry) => {
    const { id: _id, ...rest } = entry
    setEditingId(entry.id)
    setDraft({ ...emptyDraft, ...rest })
    setOpen(true)
  }

  const valid =
    draft.clientName &&
    draft.projectName &&
    draft.feedbackDate &&
    draft.subject &&
    draft.feedbackText

  const submit = () => {
    if (!valid) return
    if (editingId) store.updateClientFeedback(editingId, draft)
    else store.addClientFeedback(draft)
    setOpen(false)
  }

  const feedbackColumns: ColumnDef<ClientFeedbackEntry>[] = [
    {
      accessorKey: 'clientName',
      header: sortableColumnHeader<ClientFeedbackEntry>('Client'),
      cell: ({ row }) => (
        <span className='font-medium'>{row.original.clientName}</span>
      ),
    },
    {
      accessorKey: 'projectName',
      header: sortableColumnHeader<ClientFeedbackEntry>('Project'),
      cell: ({ row }) => row.original.projectName,
    },
    {
      accessorKey: 'feedbackDate',
      header: sortableColumnHeader<ClientFeedbackEntry>('Date'),
      cell: ({ row }) => row.original.feedbackDate,
    },
    {
      accessorKey: 'subject',
      header: sortableColumnHeader<ClientFeedbackEntry>('Subject'),
      cell: ({ row }) => row.original.subject,
    },
    {
      accessorKey: 'feedbackType',
      header: sortableColumnHeader<ClientFeedbackEntry>('Type'),
      cell: ({ row }) => (
        <Badge variant={FEEDBACK_BADGES[row.original.feedbackType]}>
          {row.original.feedbackType}
        </Badge>
      ),
    },
    {
      accessorKey: 'feedbackText',
      header: sortableColumnHeader<ClientFeedbackEntry>('Feedback'),
      meta: { cellClassName: 'max-w-64 truncate' },
      cell: ({ row }) => (
        <span title={row.original.feedbackText}>
          {row.original.feedbackText}
        </span>
      ),
    },
    {
      accessorKey: 'documentName',
      header: sortableColumnHeader<ClientFeedbackEntry>('Document'),
      cell: ({ row }) => row.original.documentName || '—',
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      meta: { headerClassName: 'w-20' },
      cell: ({ row }) => (
        <div className='flex items-center gap-1'>
          <Button
            variant='icon2'
            className='h-7 w-7'
            aria-label='Edit feedback'
            onClick={() => openEdit(row.original)}
          >
            <PencilSimple size={14} />
          </Button>
          <Button
            variant='icon2'
            className='h-7 w-7'
            aria-label='Delete feedback'
            onClick={() => store.removeClientFeedback(row.original.id)}
          >
            <Trash size={14} />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <Card className='border-gray-200'>
      <CardContent className='space-y-4 pt-4'>
        <div className='flex items-center justify-between'>
          <SectionTitle>My client feedback</SectionTitle>
          <Button size='sm' onClick={openNew}>
            <Plus size={12} weight='bold' />
            Add New Feedback
          </Button>
        </div>

        <SimpleTable
          columns={feedbackColumns}
          data={store.clientFeedback}
          emptyMessage='No client feedback recorded yet.'
          getRowId={(f) => f.id}
        />

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className='sm:max-w-[560px]'>
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Edit Client Feedback' : 'Add New Feedback'}
              </DialogTitle>
            </DialogHeader>
            <div className='space-y-3'>
              <div className='grid grid-cols-2 gap-3'>
                <div className='space-y-1'>
                  <Label>Client name</Label>
                  <Input
                    value={draft.clientName}
                    onChange={(e) => set({ clientName: e.target.value })}
                  />
                </div>
                <div className='space-y-1'>
                  <Label>Project name</Label>
                  <Input
                    value={draft.projectName}
                    onChange={(e) => set({ projectName: e.target.value })}
                  />
                </div>
                <div className='space-y-1'>
                  <Label>Feedback date</Label>
                  <Input
                    type='date'
                    value={draft.feedbackDate}
                    onChange={(e) => set({ feedbackDate: e.target.value })}
                  />
                </div>
                <div className='space-y-1'>
                  <Label>Feedback type</Label>
                  <Select
                    value={draft.feedbackType}
                    onValueChange={(v) =>
                      set({ feedbackType: v as FeedbackType })
                    }
                  >
                    <SelectTrigger variant='secondary' className='w-full'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FEEDBACK_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-1'>
                  <Label>Subject</Label>
                  <Input
                    value={draft.subject}
                    onChange={(e) => set({ subject: e.target.value })}
                  />
                </div>
                <div className='space-y-1'>
                  <Label>Document name (mock upload)</Label>
                  <Input
                    placeholder='e.g. appreciation.pdf'
                    value={draft.documentName ?? ''}
                    onChange={(e) => set({ documentName: e.target.value })}
                  />
                </div>
              </div>
              <div className='space-y-1'>
                <Label>Feedback</Label>
                <Textarea
                  rows={4}
                  value={draft.feedbackText}
                  onChange={(e) => set({ feedbackText: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant='outline' onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={!valid}>
                {editingId ? 'Save changes' : 'Add feedback'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
