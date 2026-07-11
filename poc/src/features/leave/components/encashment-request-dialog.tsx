import { useEffect, useMemo, useState } from 'react'
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
import { type LeaveType } from '../data/leave-types'
import { type BalancesStore } from '../hooks/use-balances'

interface EncashmentRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employeeId: string
  leaveTypes: LeaveType[]
  balances: BalancesStore
}

/**
 * Employee-facing leave encashment (payout) request — the flow behind the
 * payout rules in Time Off Management global settings and the registry
 * event "Leave encashment requested". Inline validation on every field.
 */
export function EncashmentRequestDialog({
  open,
  onOpenChange,
  employeeId,
  leaveTypes,
  balances,
}: EncashmentRequestDialogProps) {
  const [typeId, setTypeId] = useState('')
  const [units, setUnits] = useState('')
  const [reason, setReason] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) return
    setTypeId('')
    setUnits('')
    setReason('')
    setErrors({})
  }, [open])

  // Only paid types with a positive remaining balance can be encashed.
  const encashableTypes = useMemo(
    () =>
      leaveTypes.filter(
        (t) =>
          t.active &&
          t.category === 'paid' &&
          balances.remainingFor(employeeId, t.id) > 0
      ),
    [balances, employeeId, leaveTypes]
  )

  const selectedType = leaveTypes.find((t) => t.id === typeId)
  const available = selectedType
    ? balances.remainingFor(employeeId, selectedType.id)
    : 0
  const parsedUnits = Number(units)

  const submit = () => {
    const next: Record<string, string> = {}
    if (!typeId) next.typeId = 'Select a leave type to encash'
    if (!units || Number.isNaN(parsedUnits) || parsedUnits <= 0)
      next.units = 'Enter the number of units to encash'
    else if (selectedType && parsedUnits > available)
      next.units = `Only ${available} ${selectedType.unit} available to encash`
    if (reason.trim().length < 3) next.reason = 'A reason is required'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    balances.requestEncashment({
      employeeId,
      typeId,
      typeName: selectedType!.name,
      unit: selectedType!.unit,
      units: parsedUnits,
      reason: reason.trim(),
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[440px]'>
        <DialogHeader>
          <DialogTitle>Request leave encashment</DialogTitle>
          <DialogDescription>
            Convert unused paid leave into a payout per the configured payout
            policy. The request routes to the Time Off Admin for approval.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4'>
          <div className='space-y-1'>
            <Label>Leave type</Label>
            <Select value={typeId} onValueChange={setTypeId}>
              <SelectTrigger variant='secondary' className='w-full'>
                <SelectValue placeholder='Select a paid leave type' />
              </SelectTrigger>
              <SelectContent>
                {encashableTypes.length === 0 && (
                  <SelectItem value='none' disabled>
                    No encashable balance available
                  </SelectItem>
                )}
                {encashableTypes.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} — {balances.remainingFor(employeeId, t.id)}{' '}
                    {t.unit} available
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.typeId && (
              <p className='text-destructive text-xs'>{errors.typeId}</p>
            )}
          </div>
          <div className='space-y-1'>
            <Label>
              Units to encash{selectedType ? ` (${selectedType.unit})` : ''}
            </Label>
            <Input
              type='number'
              min={1}
              max={available || undefined}
              value={units}
              onChange={(e) => setUnits(e.target.value)}
              placeholder={
                selectedType
                  ? `Up to ${available} ${selectedType.unit}`
                  : 'Select a leave type first'
              }
            />
            {errors.units && (
              <p className='text-destructive text-xs'>{errors.units}</p>
            )}
          </div>
          <div className='space-y-1'>
            <Label>Reason</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder='e.g. Unused balance above the carry-forward cap'
              rows={2}
            />
            {errors.reason && (
              <p className='text-destructive text-xs'>{errors.reason}</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (encashableTypes.length === 0) {
                toast.info('No encashable paid-leave balance available')
                return
              }
              submit()
            }}
          >
            Submit request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
