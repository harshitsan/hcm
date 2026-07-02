import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Interview } from '../data/candidates'
import type { InterviewPanel, RoundsConfig } from '../data/config'

interface ScheduleInterviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  candidateCount: number
  panels: InterviewPanel[]
  roundsConfigs: RoundsConfig[]
  onSchedule: (details: {
    roundName: string
    round: number
    panel: string[]
    date: string
    time: string
    mode: Interview['mode']
  }) => void
}

/**
 * Schedule interviews for one or many candidates (TA-08, TA-41, TA-42).
 * Rounds come from the configured loop; the panel is drawn from the panel
 * mapped to the selected round.
 */
export function ScheduleInterviewDialog({
  open,
  onOpenChange,
  candidateCount,
  panels,
  roundsConfigs,
  onSchedule,
}: ScheduleInterviewDialogProps) {
  const [configId, setConfigId] = useState(roundsConfigs[0]?.id ?? '')
  const [roundNo, setRoundNo] = useState('1')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('10:00')
  const [mode, setMode] = useState<Interview['mode']>('Video')

  const config = roundsConfigs.find((c) => c.id === configId)
  const round = config?.rounds.find((r) => String(r.round) === roundNo)
  const panel = useMemo(
    () => panels.find((p) => p.id === round?.panelId),
    [panels, round]
  )

  const submit = () => {
    if (!round || !panel || !date) return
    onSchedule({
      roundName: round.name,
      round: round.round,
      panel: panel.members,
      date,
      time,
      mode,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[440px]'>
        <DialogHeader>
          <DialogTitle>
            {candidateCount > 1
              ? `Schedule mass interviews (${candidateCount} candidates)`
              : 'Schedule interview'}
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-3'>
          <div>
            <p className='mb-1 text-sm font-medium'>Interview loop</p>
            <Select
              value={configId}
              onValueChange={(v) => {
                setConfigId(v)
                setRoundNo('1')
              }}
            >
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Select configured loop' />
              </SelectTrigger>
              <SelectContent>
                {roundsConfigs.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} ({c.department})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <p className='mb-1 text-sm font-medium'>Round</p>
            <Select value={roundNo} onValueChange={setRoundNo}>
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(config?.rounds ?? []).map((r) => (
                  <SelectItem key={r.round} value={String(r.round)}>
                    Round {r.round} — {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {panel && (
              <p className='text-paragraph-sm text-neutral-1000 mt-1'>
                Panel (from round mapping): {panel.name} —{' '}
                {panel.members.join(', ')}
              </p>
            )}
          </div>

          <div className='grid grid-cols-3 gap-3'>
            <div className='col-span-1'>
              <p className='mb-1 text-sm font-medium'>Date</p>
              <Input
                type='date'
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <p className='mb-1 text-sm font-medium'>Time</p>
              <Input
                type='time'
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
            <div>
              <p className='mb-1 text-sm font-medium'>Mode</p>
              <Select
                value={mode}
                onValueChange={(v) => setMode(v as Interview['mode'])}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['Video', 'In-person', 'Phone'] as const).map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <p className='text-paragraph-sm text-neutral-1000'>
            Calendar entries are created for the candidate and all panel
            members; conflicts for a panel member are surfaced before booking.
          </p>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!round || !panel || !date} onClick={submit}>
            Book {candidateCount > 1 ? `${candidateCount} interviews` : 'interview'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
