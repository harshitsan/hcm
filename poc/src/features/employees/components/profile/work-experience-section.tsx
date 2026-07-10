import { useState } from 'react'
import { PencilSimple, Plus, Trash } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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
  SimpleTable,
  sortableColumnHeader,
} from '@/components/common/data-table/simple-table'
import type { ColumnDef } from '@tanstack/react-table'
import { Textarea } from '@/components/ui/textarea'
import {
  type WorkExperienceDraft,
  type WorkExperienceEntry,
} from '../../data/profile-extras'
import { type ProfileExtrasStore } from '../../hooks/use-profile-extras'
import { SectionTitle } from '../shared'

const emptyDraft: WorkExperienceDraft = {
  isCurrentEmployer: false,
  employerName: '',
  fromDate: '',
  toDate: '',
  jobTitle: '',
  jobLocation: '',
  startingCtc: '',
  endingCtc: '',
  comments: '',
}

/** Kensium profile parity — Work Experience tab: employment history with CRUD. */
export function WorkExperienceSection({
  store,
}: {
  store: ProfileExtrasStore
}) {
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<WorkExperienceDraft>(emptyDraft)

  const set = (patch: Partial<WorkExperienceDraft>) =>
    setDraft((d) => ({ ...d, ...patch }))

  const openNew = () => {
    setEditingId(null)
    setDraft(emptyDraft)
    setOpen(true)
  }

  const openEdit = (entry: WorkExperienceEntry) => {
    const { id: _id, ...rest } = entry
    setEditingId(entry.id)
    setDraft(rest)
    setOpen(true)
  }

  const valid =
    draft.employerName &&
    draft.jobTitle &&
    draft.fromDate &&
    (draft.isCurrentEmployer || draft.toDate)

  const submit = () => {
    if (!valid) return
    const payload = draft.isCurrentEmployer ? { ...draft, toDate: '' } : draft
    if (editingId) store.updateWorkExperience(editingId, payload)
    else store.addWorkExperience(payload)
    setOpen(false)
  }

  const workExperienceColumns: ColumnDef<WorkExperienceEntry>[] = [
    {
      accessorKey: 'employerName',
      header: sortableColumnHeader<WorkExperienceEntry>('Employer'),
      cell: ({ row }) => (
        <span className='flex items-center gap-1.5 font-medium'>
          {row.original.employerName}
          {row.original.isCurrentEmployer && (
            <Badge variant='qualified'>Current</Badge>
          )}
        </span>
      ),
    },
    {
      accessorKey: 'jobTitle',
      header: sortableColumnHeader<WorkExperienceEntry>('Job Title'),
      cell: ({ row }) => row.original.jobTitle,
    },
    {
      accessorKey: 'jobLocation',
      header: sortableColumnHeader<WorkExperienceEntry>('Location'),
      cell: ({ row }) => row.original.jobLocation || '—',
    },
    {
      accessorKey: 'fromDate',
      header: sortableColumnHeader<WorkExperienceEntry>('From'),
      cell: ({ row }) => row.original.fromDate,
    },
    {
      id: 'toDate',
      accessorFn: (e) => (e.isCurrentEmployer ? 'Present' : e.toDate),
      header: sortableColumnHeader<WorkExperienceEntry>('To'),
      cell: ({ row }) =>
        row.original.isCurrentEmployer ? 'Present' : row.original.toDate,
    },
    {
      accessorKey: 'startingCtc',
      header: sortableColumnHeader<WorkExperienceEntry>('Starting CTC'),
      cell: ({ row }) => row.original.startingCtc || '—',
    },
    {
      accessorKey: 'endingCtc',
      header: sortableColumnHeader<WorkExperienceEntry>('Ending CTC'),
      cell: ({ row }) => row.original.endingCtc || '—',
    },
    {
      accessorKey: 'comments',
      header: sortableColumnHeader<WorkExperienceEntry>('Comments'),
      meta: { cellClassName: 'max-w-56 truncate' },
      cell: ({ row }) => (
        <span title={row.original.comments}>
          {row.original.comments || '—'}
        </span>
      ),
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
            aria-label='Edit work experience'
            onClick={() => openEdit(row.original)}
          >
            <PencilSimple size={14} />
          </Button>
          <Button
            variant='icon2'
            className='h-7 w-7'
            aria-label='Delete work experience'
            onClick={() => store.removeWorkExperience(row.original.id)}
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
          <SectionTitle>My work experience</SectionTitle>
          <Button size='sm' onClick={openNew}>
            <Plus size={12} weight='bold' />
            Add New Work Experience
          </Button>
        </div>

        <SimpleTable
          columns={workExperienceColumns}
          data={store.workExperience}
          emptyMessage='No work experience recorded yet.'
          getRowId={(e) => e.id}
        />

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className='sm:max-w-[560px]'>
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Edit Work Experience' : 'Add New Work Experience'}
              </DialogTitle>
            </DialogHeader>
            <div className='space-y-3'>
              <label className='flex items-center gap-2 text-sm font-medium'>
                <Checkbox
                  checked={draft.isCurrentEmployer}
                  onCheckedChange={(c) =>
                    set({ isCurrentEmployer: c === true })
                  }
                />
                This is my current employer
              </label>
              <div className='grid grid-cols-2 gap-3'>
                <div className='space-y-1'>
                  <Label>Employer name</Label>
                  <Input
                    value={draft.employerName}
                    onChange={(e) => set({ employerName: e.target.value })}
                  />
                </div>
                <div className='space-y-1'>
                  <Label>Job title</Label>
                  <Input
                    value={draft.jobTitle}
                    onChange={(e) => set({ jobTitle: e.target.value })}
                  />
                </div>
                <div className='space-y-1'>
                  <Label>From date</Label>
                  <Input
                    type='date'
                    value={draft.fromDate}
                    onChange={(e) => set({ fromDate: e.target.value })}
                  />
                </div>
                <div className='space-y-1'>
                  <Label>To date</Label>
                  <Input
                    type='date'
                    value={draft.toDate}
                    disabled={draft.isCurrentEmployer}
                    onChange={(e) => set({ toDate: e.target.value })}
                  />
                </div>
                <div className='space-y-1'>
                  <Label>Job location</Label>
                  <Input
                    value={draft.jobLocation}
                    onChange={(e) => set({ jobLocation: e.target.value })}
                  />
                </div>
                <div className='space-y-1'>
                  <Label>Starting CTC</Label>
                  <Input
                    placeholder='e.g. 4.2 LPA'
                    value={draft.startingCtc}
                    onChange={(e) => set({ startingCtc: e.target.value })}
                  />
                </div>
                <div className='space-y-1'>
                  <Label>Ending CTC</Label>
                  <Input
                    placeholder='e.g. 11.0 LPA'
                    value={draft.endingCtc}
                    onChange={(e) => set({ endingCtc: e.target.value })}
                  />
                </div>
              </div>
              <div className='space-y-1'>
                <Label>Comments</Label>
                <Textarea
                  rows={3}
                  value={draft.comments}
                  onChange={(e) => set({ comments: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant='outline' onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={!valid}>
                {editingId ? 'Save changes' : 'Add work experience'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
