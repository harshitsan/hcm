import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { GearSix } from 'phosphor-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { DataTable } from '@/components/common/data-table/table'
import { RoleGate } from '@/context/role-context'
import { type JoineeWindowConfig } from '../data/config'
import { type OnboardingCase } from '../data/onboarding'
import { DEPARTMENTS, daysBetween, fmtDate, todayISO } from '../data/shared'
import { StatusBadge } from './badges'
import { SortHeader } from './columns-shared'

/**
 * Joining-formalities status derived from the onboarding case — the New
 * Joinees report vocabulary (Pending initiation / In Progress / Completed).
 */
export function joineeStatus(c: OnboardingCase) {
  if (c.status === 'completed') return 'completed'
  if (!c.offerAccepted) return 'pending-initiation'
  return 'in-progress'
}

export type JoineeWindowState =
  | 'first-window'
  | 'on-track'
  | 'overdue'
  | 'completed'

/**
 * Window state derived at read time from the published window settings —
 * changing "first window" or "overdue after" recolours the grid immediately.
 */
export function joineeWindowState(
  c: OnboardingCase,
  config: JoineeWindowConfig,
  today: string = todayISO()
): JoineeWindowState {
  if (c.status === 'completed') return 'completed'
  const daysSinceJoining = daysBetween(c.startDate, today)
  if (daysSinceJoining > config.overdueAfterDays) return 'overdue'
  if (daysSinceJoining <= config.firstWindowDays) return 'first-window'
  return 'on-track'
}

const STATUS_FILTERS = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending-initiation', label: 'Pending Initiation' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
]

const WINDOW_FILTERS = [
  { value: 'all', label: 'All windows' },
  { value: 'first-window', label: 'In First Window' },
  { value: 'on-track', label: 'On Track' },
  { value: 'overdue', label: 'Overdue' },
]

function buildJoineeColumns(
  config: JoineeWindowConfig,
  today: string
): ColumnDef<OnboardingCase>[] {
  return [
    {
      accessorKey: 'employeeName',
      header: ({ column }) => (
        <SortHeader column={column} label='Candidate name' />
      ),
      cell: ({ row }) => (
        <div className='flex min-w-0 flex-col'>
          <span className='text-neutral-1600 font-medium'>
            {row.original.employeeName}
          </span>
          <span className='text-neutral-1000 text-xs'>
            {row.original.employeeCode}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'department',
      header: ({ column }) => <SortHeader column={column} label='Department' />,
      cell: ({ row }) => (
        <span className='text-neutral-1900 text-sm'>
          {row.original.department}
        </span>
      ),
    },
    {
      accessorKey: 'location',
      header: ({ column }) => <SortHeader column={column} label='Location' />,
      cell: ({ row }) => (
        <span className='text-neutral-1900 text-sm'>
          {row.original.location}
        </span>
      ),
    },
    {
      accessorKey: 'startDate',
      header: ({ column }) => (
        <SortHeader column={column} label='Date of joining' />
      ),
      cell: ({ row }) => (
        <span className='text-sm'>{fmtDate(row.original.startDate)}</span>
      ),
    },
    {
      accessorKey: 'currentStage',
      header: ({ column }) => <SortHeader column={column} label='Stage' />,
      cell: ({ row }) => (
        <Badge variant='outline'>{row.original.currentStage}</Badge>
      ),
    },
    {
      id: 'joineeStatus',
      header: () => (
        <span className='text-paragraph-sm font-medium'>Status</span>
      ),
      cell: ({ row }) => <StatusBadge status={joineeStatus(row.original)} />,
    },
    {
      id: 'windowState',
      header: () => (
        <span className='text-paragraph-sm font-medium'>Window</span>
      ),
      cell: ({ row }) => (
        <StatusBadge status={joineeWindowState(row.original, config, today)} />
      ),
    },
  ]
}

interface NewJoineesListProps {
  cases: OnboardingCase[]
  onSelect: (id: string) => void
  joineeWindow: JoineeWindowConfig
  onUpdateWindow: (patch: {
    firstWindowDays: number
    overdueAfterDays: number
  }) => void
}

/**
 * New Joinees report — a filtered view over the onboarding grid with the
 * joining period, status and department filters of the New Joinees screen,
 * plus window chips derived from the configurable first-window / overdue
 * definitions.
 */
export function NewJoineesList({
  cases,
  onSelect,
  joineeWindow,
  onUpdateWindow,
}: NewJoineesListProps) {
  const [status, setStatus] = useState('all')
  const [windowState, setWindowState] = useState('all')
  const [department, setDepartment] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [firstWindowInput, setFirstWindowInput] = useState('')
  const [overdueInput, setOverdueInput] = useState('')

  const today = todayISO()

  const columns = useMemo(
    () => buildJoineeColumns(joineeWindow, today),
    [joineeWindow, today]
  )

  const data = useMemo(
    () =>
      cases.filter(
        (c) =>
          (status === 'all' || joineeStatus(c) === status) &&
          (windowState === 'all' ||
            joineeWindowState(c, joineeWindow, today) === windowState) &&
          (department === 'all' || c.department === department) &&
          (from === '' || c.startDate >= from) &&
          (to === '' || c.startDate <= to)
      ),
    [cases, department, from, joineeWindow, status, to, today, windowState]
  )

  const openSettings = () => {
    setFirstWindowInput(String(joineeWindow.firstWindowDays))
    setOverdueInput(String(joineeWindow.overdueAfterDays))
    setSettingsOpen(true)
  }

  const saveSettings = () => {
    const firstWindowDays = Number(firstWindowInput)
    const overdueAfterDays = Number(overdueInput)
    if (
      !Number.isInteger(firstWindowDays) ||
      !Number.isInteger(overdueAfterDays) ||
      firstWindowDays < 1 ||
      overdueAfterDays < 1
    ) {
      toast.error('Enter whole numbers of days (at least 1) for both settings')
      return
    }
    if (overdueAfterDays < firstWindowDays) {
      toast.error(
        'The overdue threshold cannot be shorter than the first window'
      )
      return
    }
    onUpdateWindow({ firstWindowDays, overdueAfterDays })
    setSettingsOpen(false)
  }

  return (
    <div className='w-full'>
      <div className='mb-3 flex flex-wrap items-center gap-2'>
        <Input
          type='date'
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className='h-7 w-[150px]'
          aria-label='Joining from'
        />
        <Input
          type='date'
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className='h-7 w-[150px]'
          aria-label='Joining to'
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger variant='secondary' className='h-7 w-[170px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={windowState} onValueChange={setWindowState}>
          <SelectTrigger variant='secondary' className='h-7 w-[160px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WINDOW_FILTERS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={department} onValueChange={setDepartment}>
          <SelectTrigger variant='secondary' className='h-7 w-[170px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All departments</SelectItem>
            {DEPARTMENTS.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size='sm'
          variant='outline'
          onClick={() => {
            setStatus('all')
            setWindowState('all')
            setDepartment('all')
            setFrom('')
            setTo('')
            toast.info('New joinee filters cleared')
          }}
        >
          Reset
        </Button>
        <RoleGate roles={['Company Admin']}>
          <Button
            size='sm'
            variant='outline'
            className='ml-auto gap-1'
            onClick={openSettings}
          >
            <GearSix size={14} />
            Window settings
          </Button>
        </RoleGate>
      </div>

      <p className='text-paragraph-sm text-neutral-1000 mb-2'>
        First window: {joineeWindow.firstWindowDays} day(s) from joining ·
        overdue after: {joineeWindow.overdueAfterDays} day(s) — settings
        version {joineeWindow.version}, effective{' '}
        {fmtDate(joineeWindow.effectiveFrom)}.
      </p>

      <DataTable
        columns={columns}
        data={data}
        variant='no-status'
        onRowClick={(row: OnboardingCase) => onSelect(row.id)}
      />
      <p className='text-paragraph-sm text-neutral-1000 mt-2'>
        Joinees within the selected joining period — click a row to open the
        onboarding case workspace. Window chips are recomputed from the current
        window settings: joinees inside the first window show{' '}
        <span className='font-medium'>In First Window</span>, joinees past the
        overdue threshold with joining formalities still open flip to{' '}
        <span className='font-medium'>Overdue</span>, and everyone in between
        stays <span className='font-medium'>On Track</span>.
      </p>

      <Dialog
        open={settingsOpen}
        onOpenChange={(open) => {
          if (!open) setSettingsOpen(false)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New joinee window settings</DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='space-y-1'>
              <Label>First window (days)</Label>
              <Input
                type='number'
                min={1}
                value={firstWindowInput}
                onChange={(e) => setFirstWindowInput(e.target.value)}
              />
              <p className='text-neutral-1000 text-xs'>
                How long a new joinee is tracked as “in first window” after
                their joining date — the settling-in period where joining
                formalities are expected to be underway.
              </p>
            </div>
            <div className='space-y-1'>
              <Label>Overdue after (days)</Label>
              <Input
                type='number'
                min={1}
                value={overdueInput}
                onChange={(e) => setOverdueInput(e.target.value)}
              />
              <p className='text-neutral-1000 text-xs'>
                Once this many days pass after joining and the joining
                formalities are still incomplete, the joinee is flagged as
                Overdue so the team can follow up.
              </p>
            </div>
            <p className='text-neutral-1000 text-xs'>
              Saving publishes a new effective-dated version of these settings
              — every joinee’s window chip is recomputed immediately. Try
              shortening the overdue threshold to see joinees flip to Overdue.
            </p>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setSettingsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveSettings}>Save settings</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
