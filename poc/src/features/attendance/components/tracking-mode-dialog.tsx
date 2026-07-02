import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LOCATIONS } from '../data/shared'
import { type AttendanceConfigStore } from '../hooks/use-attendance-config'

/**
 * Add a tracking mode with reconciliation basis, grace period, minimum break
 * duration and Email/SMS reminders (TNA-41).
 */
export function TrackingModeDialog({
  open,
  onOpenChange,
  config,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: AttendanceConfigStore
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [locations, setLocations] = useState<string[]>([])
  const [reconciliation, setReconciliation] = useState<'priority' | 'grace-period'>('priority')
  const [grace, setGrace] = useState('10')
  const [minBreak, setMinBreak] = useState('15')
  const [remindEmail, setRemindEmail] = useState(true)
  const [remindSms, setRemindSms] = useState(false)

  const save = () => {
    if (!name.trim() || locations.length === 0) {
      toast.error('Mode name and at least one applicable location are required')
      return
    }
    config.addTrackingMode({
      name,
      description,
      locations,
      reconciliation,
      graceMinutes: Number(grace) || 0,
      minBreakMinutes: Number(minBreak) || 0,
      remindEmail,
      remindSms,
    })
    onOpenChange(false)
    setName('')
    setDescription('')
    setLocations([])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[440px]'>
        <DialogHeader>
          <DialogTitle>Add tracking mode</DialogTitle>
        </DialogHeader>
        <div className='space-y-3'>
          <div className='grid grid-cols-2 gap-3'>
            <div className='flex flex-col gap-1'>
              <Label className='text-xs'>Mode name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder='Mobile app check-in' />
            </div>
            <div className='flex flex-col gap-1'>
              <Label className='text-xs'>Description</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder='GPS-tagged punches'
              />
            </div>
          </div>
          <div className='flex flex-col gap-1'>
            <Label className='text-xs'>Applicable locations</Label>
            <div className='flex flex-wrap gap-3 pt-1'>
              {LOCATIONS.map((l) => (
                <label key={l} className='flex items-center gap-1.5 text-sm'>
                  <Checkbox
                    variant='blue'
                    checked={locations.includes(l)}
                    onCheckedChange={(v) =>
                      setLocations((prev) => (v ? [...prev, l] : prev.filter((x) => x !== l)))
                    }
                  />
                  {l}
                </label>
              ))}
            </div>
          </div>
          <div className='grid grid-cols-3 gap-3'>
            <div className='flex flex-col gap-1'>
              <Label className='text-xs'>Reconciliation</Label>
              <Select
                value={reconciliation}
                onValueChange={(v) => setReconciliation(v as typeof reconciliation)}
              >
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='priority'>By priority</SelectItem>
                  <SelectItem value='grace-period'>By grace period</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='flex flex-col gap-1'>
              <Label className='text-xs'>Grace (min)</Label>
              <Input type='number' value={grace} onChange={(e) => setGrace(e.target.value)} />
            </div>
            <div className='flex flex-col gap-1'>
              <Label className='text-xs'>Min break (min)</Label>
              <Input type='number' value={minBreak} onChange={(e) => setMinBreak(e.target.value)} />
            </div>
          </div>
          <div className='flex items-center gap-5'>
            <label className='flex items-center gap-1.5 text-sm'>
              <Checkbox variant='blue' checked={remindEmail} onCheckedChange={(v) => setRemindEmail(!!v)} />
              Email reminders before payroll cutoff
            </label>
            <label className='flex items-center gap-1.5 text-sm'>
              <Checkbox variant='blue' checked={remindSms} onCheckedChange={(v) => setRemindSms(!!v)} />
              SMS reminders
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save}>Save Mode</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
