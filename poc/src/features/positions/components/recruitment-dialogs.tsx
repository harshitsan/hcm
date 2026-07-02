import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import type { PayGrade } from '../data/org-config'
import type {
  Department,
  Position,
  PositionCustomFieldDef,
} from '../data/positions'
import type { Requisition } from '../data/recruitment'
import { positionLabel } from './assignment-dialogs'

interface NewRequisitionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Governed positions only — never free text (POS-04/13/18). */
  positions: Position[]
  departments: Department[]
  customFieldDefs: PositionCustomFieldDef[]
  gradeForLevel: (level: number | null) => PayGrade | undefined
  payGradeEnabled: boolean
  onCreate: (positionId: string, candidateName: string) => void
}

/**
 * Raise a requisition against a governed position (POS-04/18): the position
 * is selected from the reference list, its custom fields and mapped pay-grade
 * band are resolved — nothing is typed in.
 */
export function NewRequisitionDialog({
  open,
  onOpenChange,
  positions,
  departments,
  customFieldDefs,
  gradeForLevel,
  payGradeEnabled,
  onCreate,
}: NewRequisitionDialogProps) {
  const [positionId, setPositionId] = useState('')
  const [candidate, setCandidate] = useState('')

  useEffect(() => {
    if (open) {
      setPositionId('')
      setCandidate('')
    }
  }, [open])

  const selectable = positions.filter((p) => p.status === 'active')
  const selected = positions.find((p) => p.id === positionId)
  const band = selected ? gradeForLevel(selected.level) : undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[460px]'>
        <DialogHeader>
          <DialogTitle>New requisition</DialogTitle>
          <DialogDescription>
            The requisition references a governed company position from the
            reference list — its custom fields and pay-grade band resolve
            automatically instead of being typed in.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-3'>
          <div className='space-y-1.5'>
            <Label>Candidate name</Label>
            <Input
              placeholder='e.g. Elena Petrova'
              value={candidate}
              onChange={(e) => setCandidate(e.target.value)}
            />
          </div>
          <div className='space-y-1.5'>
            <Label>Governed position</Label>
            <Select value={positionId} onValueChange={setPositionId}>
              <SelectTrigger variant='secondary' className='w-full'>
                <SelectValue placeholder='Select a company position' />
              </SelectTrigger>
              <SelectContent>
                {selectable.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {positionLabel(p, departments)} ({p.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selected && (
            <div className='border-grey-200 space-y-1 rounded-[6px] border px-3 py-2'>
              <p className='text-paragraph-sm text-neutral-1600 font-medium'>
                Resolved governed definition
              </p>
              {customFieldDefs.map((def) => (
                <p key={def.id} className='text-paragraph-sm text-neutral-1000'>
                  {def.label}: {selected.customFields[def.id] ?? '—'}
                </p>
              ))}
              <p className='text-paragraph-sm text-neutral-1000'>
                Pay grade band:{' '}
                {payGradeEnabled
                  ? band
                    ? `${band.name} · $${band.minimum.toLocaleString()}–$${band.maximum.toLocaleString()}`
                    : 'No band mapped to this level'
                  : 'Position-level paygrade disabled — no band applies'}
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!positionId || candidate.trim().length < 2}
            onClick={() => {
              onCreate(positionId, candidate.trim())
              onOpenChange(false)
            }}
          >
            Create requisition
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface ExtendOfferDialogProps {
  requisition: Requisition | null
  onOpenChange: (open: boolean) => void
  positions: Position[]
  gradeForLevel: (level: number | null) => PayGrade | undefined
  payGradeEnabled: boolean
  onExtend: (salary: number, resolvedPayGradeId: string | null) => void
}

/**
 * Offer compensation resolves from the level's mapped pay-grade band; amounts
 * outside the band are flagged and blocked while the toggle is on (POS-36/37).
 */
export function ExtendOfferDialog({
  requisition,
  onOpenChange,
  positions,
  gradeForLevel,
  payGradeEnabled,
  onExtend,
}: ExtendOfferDialogProps) {
  const [salary, setSalary] = useState('')
  useEffect(() => setSalary(''), [requisition])

  const position = positions.find((p) => p.id === requisition?.positionId)
  const band = position ? gradeForLevel(position.level) : undefined
  const amount = Number(salary)
  const validAmount = salary !== '' && Number.isFinite(amount) && amount > 0
  const outOfBand =
    payGradeEnabled &&
    band !== undefined &&
    validAmount &&
    (amount < band.minimum || amount > band.maximum)

  return (
    <Dialog open={requisition !== null} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[440px]'>
        <DialogHeader>
          <DialogTitle>
            Extend offer — {requisition?.candidateName}
          </DialogTitle>
          <DialogDescription>
            {payGradeEnabled && band
              ? `Position level L${position?.level} resolves to ${band.name}: $${band.minimum.toLocaleString()}–$${band.maximum.toLocaleString()} (midpoint $${band.midpoint.toLocaleString()}). Offers outside the band are flagged.`
              : 'Position-level paygrade is disabled or no band is mapped — no band validation applies.'}
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-1.5'>
          <Label>Proposed annual salary (USD)</Label>
          <Input
            type='number'
            placeholder='e.g. 78000'
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
          />
          {outOfBand && (
            <p className='text-destructive text-paragraph-sm'>
              Out of range: the approved band for this level is $
              {band?.minimum.toLocaleString()}–${band?.maximum.toLocaleString()}.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!validAmount || outOfBand}
            onClick={() => {
              onExtend(amount, payGradeEnabled && band ? band.id : null)
              onOpenChange(false)
            }}
          >
            Extend offer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
