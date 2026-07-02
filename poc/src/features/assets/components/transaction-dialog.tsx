import { useEffect, useState } from 'react'
import { toast } from 'sonner'
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
import { Textarea } from '@/components/ui/textarea'
import { ACTION_LABELS, type Asset, type AssetAction } from '../data/assets'
import { TRANSITION_RULES } from '../data/config'
import { todayIso, type Employee } from '../data/org'
import { type TransactionOptions } from '../hooks/use-assets'

const NEEDS_EMPLOYEE: AssetAction[] = ['issue', 'loan', 'transfer']
const NEEDS_REASON: AssetAction[] = ['retire', 'dispose', 'send-repair', 'recover']

interface TransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  asset: Asset | null
  action: AssetAction | null
  employees: Employee[]
  defaultReturnDays: number
  onSubmit: (assetId: string, action: AssetAction, opts: TransactionOptions) => boolean
}

/**
 * Records a lifecycle transaction (ASM-03..06, ASM-12, ASM-13, ASM-41).
 * The store validates the transition against the decision table before
 * applying it (ASM-23); effective date supports back-dated entries (ASM-17).
 */
export function TransactionDialog({
  open,
  onOpenChange,
  asset,
  action,
  employees,
  defaultReturnDays,
  onSubmit,
}: TransactionDialogProps) {
  const [employeeId, setEmployeeId] = useState('')
  const [effectiveDate, setEffectiveDate] = useState(todayIso())
  const [expectedReturnDate, setExpectedReturnDate] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (!open || !action) return
    setEmployeeId('')
    setEffectiveDate(todayIso())
    setNote('')
    if (action === 'loan' || action === 'issue') {
      const d = new Date()
      d.setDate(d.getDate() + defaultReturnDays)
      setExpectedReturnDate(action === 'loan' ? d.toISOString().slice(0, 10) : '')
    } else {
      setExpectedReturnDate('')
    }
  }, [open, action, defaultReturnDays])

  if (!asset || !action) return null

  const needsEmployee = NEEDS_EMPLOYEE.includes(action)
  const needsReason = NEEDS_REASON.includes(action)
  const rule = TRANSITION_RULES.find((r) => r.action === action)

  const handleSubmit = () => {
    if (needsEmployee && !employeeId) {
      toast.error('Select the employee for this transaction')
      return
    }
    if (action === 'loan' && !expectedReturnDate) {
      toast.error('Loans require an expected return date')
      return
    }
    if (needsReason && note.trim().length < 3) {
      toast.error('A reason is required for this transaction')
      return
    }
    const ok = onSubmit(asset.id, action, {
      employeeId: needsEmployee ? employeeId : null,
      effectiveDate,
      expectedReturnDate: expectedReturnDate || null,
      note: note.trim(),
    })
    if (ok) onOpenChange(false)
  }

  const eligibleEmployees =
    action === 'transfer' ? employees.filter((e) => e.id !== asset.holderId) : employees

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[440px]'>
        <DialogHeader>
          <DialogTitle>{ACTION_LABELS[action]}</DialogTitle>
          <DialogDescription>
            {asset.assetTag} · {asset.name} — currently {asset.state}
            {rule
              ? `. Rule ${rule.id}: permitted from ${rule.from.join(', ')} → ${rule.to}.`
              : ''}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-3'>
          {needsEmployee && (
            <div className='flex flex-col gap-1'>
              <Label className='text-paragraph-sm'>
                {action === 'transfer' ? 'Transfer to' : 'Employee'}
              </Label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Select workforce member' />
                </SelectTrigger>
                <SelectContent>
                  {eligibleEmployees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name} · {e.department}
                      {e.hasSystemAccess ? '' : ' (non-user)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className='grid grid-cols-2 gap-3'>
            <div className='flex flex-col gap-1'>
              <Label htmlFor='txn-effective' className='text-paragraph-sm'>
                Effective date
              </Label>
              <Input
                id='txn-effective'
                type='date'
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
              />
            </div>
            {(action === 'issue' || action === 'loan') && (
              <div className='flex flex-col gap-1'>
                <Label htmlFor='txn-return' className='text-paragraph-sm'>
                  Expected return {action === 'loan' ? '(required)' : '(optional)'}
                </Label>
                <Input
                  id='txn-return'
                  type='date'
                  value={expectedReturnDate}
                  onChange={(e) => setExpectedReturnDate(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className='flex flex-col gap-1'>
            <Label htmlFor='txn-note' className='text-paragraph-sm'>
              {needsReason ? 'Reason (required)' : 'Note / condition remarks'}
            </Label>
            <Textarea
              id='txn-note'
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                action === 'return' ? 'Return condition assessment…' : 'Optional context…'
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Record transaction</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
