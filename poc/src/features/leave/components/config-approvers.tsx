import { useState } from 'react'
import { Plus } from 'phosphor-react'
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
import { toast } from 'sonner'
import { type ApproverMapping } from '../data/config'
import { LOCATIONS } from '../data/shared'
import { type LeaveSettingsStore } from '../hooks/use-leave-settings'

type MappingKind = 'timeoff' | 'adjustment' | 'fmla'

function MappingTable({
  title,
  hint,
  kind,
  rows,
  withLop,
  settings,
}: {
  title: string
  hint: string
  kind: MappingKind
  rows: ApproverMapping[]
  withLop: boolean
  settings: LeaveSettingsStore
}) {
  const [open, setOpen] = useState(false)
  const [locations, setLocations] = useState<string[]>([])
  const [approvers, setApprovers] = useState('')
  const [lop, setLop] = useState('')

  const save = () => {
    if (locations.length === 0 || !approvers.trim()) {
      toast.error('Select at least one location and one approver')
      return
    }
    settings.addMapping(kind, {
      locations,
      approvers: approvers.split(',').map((a) => a.trim()),
      lopApprovers: withLop && lop.trim() ? lop.split(',').map((a) => a.trim()) : [],
    })
    setOpen(false)
    setLocations([])
    setApprovers('')
    setLop('')
  }

  return (
    <div>
      <div className='mb-2 flex items-center justify-between'>
        <h3 className='text-neutral-1600 text-sm font-medium'>
          {title}
          <span className='text-neutral-1000 ml-2 text-xs'>{hint}</span>
        </h3>
        <Button variant='outline' className='h-7 gap-1' onClick={() => setOpen(true)}>
          <Plus size={12} weight='bold' />
          Add mapping
        </Button>
      </div>
      <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
        {rows.length === 0 ? (
          <p className='text-neutral-1000 py-4 text-center text-sm'>
            No approvers configured — requests in unmapped locations cannot be
            routed. Add a mapping to complete configuration.
          </p>
        ) : (
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-neutral-1000 border-b text-left text-xs'>
                <th className='py-2 pr-3 font-medium'>Locations</th>
                <th className='px-2 font-medium'>Approvers</th>
                {withLop && <th className='px-2 font-medium'>Loss-of-pay approver</th>}
                <th className='px-2 text-right font-medium'>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id} className='border-b last:border-0'>
                  <td className='py-2 pr-3'>{m.locations.join(', ')}</td>
                  <td className='px-2'>{m.approvers.join(', ')}</td>
                  {withLop && (
                    <td className='px-2'>{m.lopApprovers.join(', ') || '—'}</td>
                  )}
                  <td className='px-2 text-right'>
                    <Button
                      variant='outline'
                      className='text-destructive h-6 px-2 text-xs'
                      onClick={() => settings.removeMapping(kind, m.id)}
                    >
                      Remove
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title} — new mapping</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div>
              <Label className='mb-1 block'>Locations</Label>
              <div className='grid grid-cols-2 gap-1'>
                {LOCATIONS.map((l) => (
                  <label key={l} className='flex items-center gap-2 text-sm'>
                    <Checkbox
                      checked={locations.includes(l)}
                      onCheckedChange={(v) =>
                        setLocations((prev) =>
                          v ? [...prev, l] : prev.filter((x) => x !== l)
                        )
                      }
                      variant='blue'
                    />
                    {l}
                  </label>
                ))}
              </div>
            </div>
            <div className='space-y-1'>
              <Label>Approver(s), comma separated</Label>
              <Input
                value={approvers}
                onChange={(e) => setApprovers(e.target.value)}
                placeholder='e.g. Sunita Patil, Rahul Menon'
              />
            </div>
            {withLop && (
              <div className='space-y-1'>
                <Label>Loss-of-pay approver(s)</Label>
                <Input
                  value={lop}
                  onChange={(e) => setLop(e.target.value)}
                  placeholder='Distinct approver for unpaid portions'
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save}>Save mapping</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/**
 * Location-based approver configuration: Time Off Approvers with a distinct
 * LOP approver (LVE-41), Adjustment Approvers (LVE-42), FMLA Approvers
 * (LVE-37) and FMLA qualifying/rejection reasons (LVE-38/39).
 */
export function ConfigApprovers({ settings }: { settings: LeaveSettingsStore }) {
  const [reasonOpen, setReasonOpen] = useState(false)
  const [reasonKind, setReasonKind] = useState<'qualifying' | 'rejection'>('qualifying')
  const [fmlaType, setFmlaType] = useState('')
  const [reasonText, setReasonText] = useState('')

  const saveReason = () => {
    if (!fmlaType.trim() || !reasonText.trim()) {
      toast.error('FMLA type and reason are both required')
      return
    }
    settings.addFmlaReason({ fmlaType, reason: reasonText, kind: reasonKind })
    setReasonOpen(false)
    setFmlaType('')
    setReasonText('')
  }

  const reasonRows = (kind: 'qualifying' | 'rejection') =>
    settings.fmlaReasons.filter((r) => r.kind === kind)

  return (
    <div className='w-full space-y-5'>
      <MappingTable
        title='Time Off Approvers'
        hint='paid leave routes to the approver; LOP portions to the LOP approver'
        kind='timeoff'
        rows={settings.timeOffApprovers}
        withLop
        settings={settings}
      />
      <MappingTable
        title='Time Off Adjustment Approvers'
        hint='balance adjustments route here, not to normal leave approvers'
        kind='adjustment'
        rows={settings.adjustmentApprovers}
        withLop={false}
        settings={settings}
      />
      <MappingTable
        title='FMLA Approvers'
        hint='FMLA-flagged requests route only to the approvers for their location'
        kind='fmla'
        rows={settings.fmlaApprovers}
        withLop={false}
        settings={settings}
      />

      <div>
        <div className='mb-2 flex items-center justify-between'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            FMLA Qualifying & Rejection Reasons
          </h3>
          <Button variant='outline' className='h-7 gap-1' onClick={() => setReasonOpen(true)}>
            <Plus size={12} weight='bold' />
            Add reason
          </Button>
        </div>
        <div className='grid gap-3 lg:grid-cols-2'>
          {(['qualifying', 'rejection'] as const).map((kind) => (
            <div key={kind} className='rounded-[8px] border border-gray-200 bg-white p-3'>
              <h4 className='mb-2 text-xs font-semibold uppercase'>
                {kind === 'qualifying' ? 'Qualifying reasons' : 'Rejection reasons'}
              </h4>
              {reasonRows(kind).length === 0 ? (
                <p className='text-neutral-1000 py-3 text-center text-sm'>
                  None configured yet — add reasons so requests can be{' '}
                  {kind === 'qualifying' ? 'classified' : 'rejected consistently'}.
                </p>
              ) : (
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='text-neutral-1000 border-b text-left text-xs'>
                      <th className='py-1.5 pr-3 font-medium'>FMLA type</th>
                      <th className='font-medium'>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reasonRows(kind).map((r) => (
                      <tr key={r.id} className='border-b last:border-0'>
                        <td className='py-1.5 pr-3'>{r.fmlaType}</td>
                        <td>{r.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      </div>

      <Dialog open={reasonOpen} onOpenChange={setReasonOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add FMLA reason</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='space-y-1'>
              <Label>Kind</Label>
              <Select
                value={reasonKind}
                onValueChange={(v) => setReasonKind(v as 'qualifying' | 'rejection')}
              >
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='qualifying'>Qualifying reason</SelectItem>
                  <SelectItem value='rejection'>Rejection reason</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-1'>
              <Label>FMLA type</Label>
              <Input
                value={fmlaType}
                onChange={(e) => setFmlaType(e.target.value)}
                placeholder='e.g. Family Care'
              />
            </div>
            <div className='space-y-1'>
              <Label>Reason text</Label>
              <Input
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
                placeholder='Statutory reason wording'
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setReasonOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveReason}>Save reason</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
