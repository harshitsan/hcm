import { useState } from 'react'
import { PencilSimple, Plus, Trash } from 'phosphor-react'
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
import type { ColumnDef } from '@tanstack/react-table'
import {
  EDUCATION_MODES,
  EDUCATION_TYPES,
  type EducationDraft,
  type EducationEntry,
  type EducationMode,
  type EducationType,
} from '../../data/profile-extras'
import { type ProfileExtrasStore } from '../../hooks/use-profile-extras'
import { SectionTitle } from '../shared'

const emptyDraft: EducationDraft = {
  educationType: 'Graduation',
  education: '',
  specialization: '',
  universityCollege: '',
  yearOfPassing: '',
  mode: 'Full time',
  startDate: '',
  endDate: '',
  gpaScore: '',
}

/** Kensium profile parity — Education tab: qualification history with CRUD. */
export function EducationSection({ store }: { store: ProfileExtrasStore }) {
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<EducationDraft>(emptyDraft)

  const set = (patch: Partial<EducationDraft>) =>
    setDraft((d) => ({ ...d, ...patch }))

  const openNew = () => {
    setEditingId(null)
    setDraft(emptyDraft)
    setOpen(true)
  }

  const openEdit = (entry: EducationEntry) => {
    const { id: _id, ...rest } = entry
    setEditingId(entry.id)
    setDraft(rest)
    setOpen(true)
  }

  const valid =
    draft.education && draft.universityCollege && draft.yearOfPassing

  const submit = () => {
    if (!valid) return
    if (editingId) store.updateEducation(editingId, draft)
    else store.addEducation(draft)
    setOpen(false)
  }

  const educationColumns: ColumnDef<EducationEntry>[] = [
    {
      accessorKey: 'educationType',
      header: sortableColumnHeader<EducationEntry>('Education Type'),
      cell: ({ row }) => row.original.educationType,
    },
    {
      accessorKey: 'education',
      header: sortableColumnHeader<EducationEntry>('Education'),
      cell: ({ row }) => (
        <span className='font-medium'>{row.original.education}</span>
      ),
    },
    {
      accessorKey: 'specialization',
      header: sortableColumnHeader<EducationEntry>('Specialization'),
      cell: ({ row }) => row.original.specialization || '—',
    },
    {
      accessorKey: 'universityCollege',
      header: sortableColumnHeader<EducationEntry>('University / College'),
      cell: ({ row }) => row.original.universityCollege,
    },
    {
      accessorKey: 'yearOfPassing',
      header: sortableColumnHeader<EducationEntry>('Year of Passing'),
      cell: ({ row }) => row.original.yearOfPassing,
    },
    {
      accessorKey: 'mode',
      header: sortableColumnHeader<EducationEntry>('Mode'),
      cell: ({ row }) => row.original.mode,
    },
    {
      accessorKey: 'gpaScore',
      header: sortableColumnHeader<EducationEntry>('GPA / Score'),
      cell: ({ row }) => row.original.gpaScore || '—',
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
            aria-label='Edit education'
            onClick={() => openEdit(row.original)}
          >
            <PencilSimple size={14} />
          </Button>
          <Button
            variant='icon2'
            className='h-7 w-7'
            aria-label='Delete education'
            onClick={() => store.removeEducation(row.original.id)}
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
          <SectionTitle>My education</SectionTitle>
          <Button size='sm' onClick={openNew}>
            <Plus size={12} weight='bold' />
            Add New Education
          </Button>
        </div>

        <SimpleTable
          columns={educationColumns}
          data={store.education}
          emptyMessage='No education details recorded yet.'
          getRowId={(e) => e.id}
        />

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className='sm:max-w-[560px]'>
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Edit Education' : 'Add New Education'}
              </DialogTitle>
            </DialogHeader>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1'>
                <Label>Education type</Label>
                <Select
                  value={draft.educationType}
                  onValueChange={(v) => set({ educationType: v as EducationType })}
                >
                  <SelectTrigger variant='secondary' className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EDUCATION_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-1'>
                <Label>Education</Label>
                <Input
                  placeholder='e.g. B.E. Computer Science'
                  value={draft.education}
                  onChange={(e) => set({ education: e.target.value })}
                />
              </div>
              <div className='space-y-1'>
                <Label>Specialization</Label>
                <Input
                  value={draft.specialization}
                  onChange={(e) => set({ specialization: e.target.value })}
                />
              </div>
              <div className='space-y-1'>
                <Label>University / College</Label>
                <Input
                  value={draft.universityCollege}
                  onChange={(e) => set({ universityCollege: e.target.value })}
                />
              </div>
              <div className='space-y-1'>
                <Label>Year of passing</Label>
                <Input
                  placeholder='e.g. 2017'
                  value={draft.yearOfPassing}
                  onChange={(e) => set({ yearOfPassing: e.target.value })}
                />
              </div>
              <div className='space-y-1'>
                <Label>Mode</Label>
                <Select
                  value={draft.mode}
                  onValueChange={(v) => set({ mode: v as EducationMode })}
                >
                  <SelectTrigger variant='secondary' className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EDUCATION_MODES.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-1'>
                <Label>Start date</Label>
                <Input
                  type='date'
                  value={draft.startDate}
                  onChange={(e) => set({ startDate: e.target.value })}
                />
              </div>
              <div className='space-y-1'>
                <Label>End date</Label>
                <Input
                  type='date'
                  value={draft.endDate}
                  onChange={(e) => set({ endDate: e.target.value })}
                />
              </div>
              <div className='space-y-1'>
                <Label>GPA / Score</Label>
                <Input
                  placeholder='e.g. 8.4 CGPA or 82%'
                  value={draft.gpaScore}
                  onChange={(e) => set({ gpaScore: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant='outline' onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={!valid}>
                {editingId ? 'Save changes' : 'Add education'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
