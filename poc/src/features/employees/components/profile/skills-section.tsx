import { useState } from 'react'
import { PencilSimple, Plus, Star, Trash } from 'phosphor-react'
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
import {
  CERT_EXPIRY_WINDOW_DAYS,
  CERT_REFERENCE_DATE,
  type SkillDraft,
  type SkillEntry,
} from '../../data/profile-extras'
import { type ProfileExtrasStore } from '../../hooks/use-profile-extras'
import { SectionTitle } from '../shared'

const emptyDraft: SkillDraft = {
  skillTechnology: '',
  experienceYears: 0,
  rating: 3,
  hasCertification: false,
  certificateName: '',
  validFrom: '',
  validTo: '',
  isRenewable: false,
  remindDaysBefore: 30,
  documentName: '',
}

/**
 * Renewal-reminder stand-in: certification expiring within the configured
 * window of the POC reference date gets an "Expiring soon" badge.
 */
function certExpiryStatus(validTo?: string): 'expired' | 'expiring' | null {
  if (!validTo) return null
  const diffDays =
    (new Date(validTo).getTime() - new Date(CERT_REFERENCE_DATE).getTime()) /
    86_400_000
  if (diffDays < 0) return 'expired'
  if (diffDays <= CERT_EXPIRY_WINDOW_DAYS) return 'expiring'
  return null
}

/** 1–5 proficiency rendered as stars (read-only or clickable). */
function StarRating({
  value,
  onChange,
}: {
  value: number
  onChange?: (value: number) => void
}) {
  return (
    <span className='flex items-center gap-0.5'>
      {[1, 2, 3, 4, 5].map((n) =>
        onChange ? (
          <button
            key={n}
            type='button'
            aria-label={`Rate ${n} of 5`}
            onClick={() => onChange(n)}
            className='text-orange-1200'
          >
            <Star size={16} weight={n <= value ? 'fill' : 'regular'} />
          </button>
        ) : (
          <Star
            key={n}
            size={14}
            weight={n <= value ? 'fill' : 'regular'}
            className='text-orange-1200'
          />
        )
      )}
    </span>
  )
}

/** Kensium profile parity — Skills tab: skills, ratings & certifications. */
export function SkillsSection({ store }: { store: ProfileExtrasStore }) {
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<SkillDraft>(emptyDraft)

  const set = (patch: Partial<SkillDraft>) =>
    setDraft((d) => ({ ...d, ...patch }))

  const openNew = () => {
    setEditingId(null)
    setDraft(emptyDraft)
    setOpen(true)
  }

  const openEdit = (entry: SkillEntry) => {
    const { id: _id, ...rest } = entry
    setEditingId(entry.id)
    setDraft({ ...emptyDraft, ...rest })
    setOpen(true)
  }

  const valid =
    draft.skillTechnology &&
    (!draft.hasCertification || draft.certificateName)

  const submit = () => {
    if (!valid) return
    const payload: SkillDraft = draft.hasCertification
      ? draft
      : {
          skillTechnology: draft.skillTechnology,
          experienceYears: draft.experienceYears,
          rating: draft.rating,
          hasCertification: false,
        }
    if (editingId) store.updateSkill(editingId, payload)
    else store.addSkill(payload)
    setOpen(false)
  }

  const skillColumns: ColumnDef<SkillEntry>[] = [
    {
      accessorKey: 'skillTechnology',
      header: sortableColumnHeader<SkillEntry>('Skill / Technology'),
      cell: ({ row }) => (
        <span className='font-medium'>{row.original.skillTechnology}</span>
      ),
    },
    {
      accessorKey: 'experienceYears',
      header: sortableColumnHeader<SkillEntry>('Experience (yrs)'),
      cell: ({ row }) => row.original.experienceYears,
    },
    {
      accessorKey: 'rating',
      header: sortableColumnHeader<SkillEntry>('Rating'),
      cell: ({ row }) => <StarRating value={row.original.rating} />,
    },
    {
      id: 'certification',
      accessorFn: (s) => (s.hasCertification ? s.certificateName : ''),
      header: sortableColumnHeader<SkillEntry>('Certification'),
      cell: ({ row }) => {
        const s = row.original
        const expiry = s.hasCertification ? certExpiryStatus(s.validTo) : null
        return s.hasCertification ? (
          <span className='flex items-center gap-1.5'>
            {s.certificateName}
            {expiry === 'expiring' && (
              <Badge variant='overdue'>Expiring soon</Badge>
            )}
            {expiry === 'expired' && (
              <Badge variant='disqualified'>Expired</Badge>
            )}
          </span>
        ) : (
          '—'
        )
      },
    },
    {
      accessorKey: 'validFrom',
      header: sortableColumnHeader<SkillEntry>('Valid From'),
      cell: ({ row }) => row.original.validFrom || '—',
    },
    {
      accessorKey: 'validTo',
      header: sortableColumnHeader<SkillEntry>('Valid To'),
      cell: ({ row }) => row.original.validTo || '—',
    },
    {
      accessorKey: 'documentName',
      header: sortableColumnHeader<SkillEntry>('Document'),
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
            aria-label='Edit skill'
            onClick={() => openEdit(row.original)}
          >
            <PencilSimple size={14} />
          </Button>
          <Button
            variant='icon2'
            className='h-7 w-7'
            aria-label='Delete skill'
            onClick={() => store.removeSkill(row.original.id)}
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
          <SectionTitle>My skills & certifications</SectionTitle>
          <Button size='sm' onClick={openNew}>
            <Plus size={12} weight='bold' />
            Add New Skill
          </Button>
        </div>

        <SimpleTable
          columns={skillColumns}
          data={store.skills}
          emptyMessage='No skills recorded yet.'
          getRowId={(s) => s.id}
        />
        <p className='text-paragraph-sm text-neutral-1000'>
          Certifications expiring within {CERT_EXPIRY_WINDOW_DAYS} days are
          flagged so you can plan the renewal in time.
        </p>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className='sm:max-w-[560px]'>
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Edit Skill' : 'Add New Skill'}
              </DialogTitle>
            </DialogHeader>
            <div className='space-y-3'>
              <div className='grid grid-cols-2 gap-3'>
                <div className='space-y-1'>
                  <Label>Skill / Technology</Label>
                  <Input
                    value={draft.skillTechnology}
                    onChange={(e) => set({ skillTechnology: e.target.value })}
                  />
                </div>
                <div className='space-y-1'>
                  <Label>Experience (years)</Label>
                  <Input
                    type='number'
                    min={0}
                    value={draft.experienceYears}
                    onChange={(e) =>
                      set({ experienceYears: Number(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>
              <div className='space-y-1'>
                <Label>Self rating (1–5)</Label>
                <StarRating
                  value={draft.rating}
                  onChange={(rating) => set({ rating })}
                />
              </div>
              <label className='flex items-center gap-2 text-sm font-medium'>
                <Checkbox
                  checked={draft.hasCertification}
                  onCheckedChange={(c) =>
                    set({ hasCertification: c === true })
                  }
                />
                I hold a certification for this skill
              </label>
              {draft.hasCertification && (
                <div className='grid grid-cols-2 gap-3 rounded-md border border-gray-200 p-3'>
                  <div className='col-span-2 space-y-1'>
                    <Label>Certificate name</Label>
                    <Input
                      value={draft.certificateName ?? ''}
                      onChange={(e) =>
                        set({ certificateName: e.target.value })
                      }
                    />
                  </div>
                  <div className='space-y-1'>
                    <Label>Valid from</Label>
                    <Input
                      type='date'
                      value={draft.validFrom ?? ''}
                      onChange={(e) => set({ validFrom: e.target.value })}
                    />
                  </div>
                  <div className='space-y-1'>
                    <Label>Valid to</Label>
                    <Input
                      type='date'
                      value={draft.validTo ?? ''}
                      onChange={(e) => set({ validTo: e.target.value })}
                    />
                  </div>
                  <label className='flex items-center gap-2 text-sm font-medium'>
                    <Checkbox
                      checked={draft.isRenewable === true}
                      onCheckedChange={(c) => set({ isRenewable: c === true })}
                    />
                    Renewable
                  </label>
                  <div className='space-y-1'>
                    <Label>Remind me (days before expiry)</Label>
                    <Input
                      type='number'
                      min={0}
                      value={draft.remindDaysBefore ?? 0}
                      onChange={(e) =>
                        set({ remindDaysBefore: Number(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className='col-span-2 space-y-1'>
                    <Label>Document name (mock upload)</Label>
                    <Input
                      placeholder='e.g. certificate.pdf'
                      value={draft.documentName ?? ''}
                      onChange={(e) => set({ documentName: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant='outline' onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={!valid}>
                {editingId ? 'Save changes' : 'Add skill'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
