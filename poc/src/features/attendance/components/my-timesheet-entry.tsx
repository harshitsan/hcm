import { useMemo, useState } from 'react'
import { CopySimple, FileArrowUp, PaperPlaneTilt, Plus, Trash } from 'phosphor-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { fmtDate, fmtHours } from '../data/shared'
import {
  ENTRY_DAY_LABELS,
  TIMESHEET_PROJECTS,
  TYPES_OF_WORK,
  currentWeekDays,
  importedTimesheetRows,
  isBillableWork,
  previousWeekTimesheetRows,
  type TimesheetEntry,
  type TimesheetSeedRow,
  type TypeOfWork,
} from '../data/tracking'

interface EntryRow {
  id: string
  project: string
  task: string
  typeOfWork: TypeOfWork
  /** Hours per weekday Mon(0) … Sun(6), kept as input strings. */
  hours: string[]
}

function blankRow(): EntryRow {
  return {
    id: `row-${crypto.randomUUID().slice(0, 8)}`,
    project: TIMESHEET_PROJECTS[0],
    task: '',
    typeOfWork: 'Development',
    hours: Array(7).fill(''),
  }
}

function seedToRow(seed: TimesheetSeedRow): EntryRow {
  return {
    id: `row-${crypto.randomUUID().slice(0, 8)}`,
    project: seed.project,
    task: seed.task,
    typeOfWork: seed.typeOfWork,
    hours: seed.hours.map((h) => (h > 0 ? String(h) : '')),
  }
}

function parseHours(value: string) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? Math.min(n, 24) : 0
}

function rowTotal(row: EntryRow) {
  return row.hours.reduce((s, h) => s + parseHours(h), 0)
}

/**
 * My Timesheet Entry: weekly entry grid (rows × Mon–Sun), type-of-work per
 * row, Copy Previous Week / Import actions, and Submit for Approval which
 * files every non-empty cell as a submitted entry awaiting the approver
 * (surfaced back in Saved Entries; the registry's "Timesheet approved"
 * event fires when the approver acts).
 */
export function MyTimesheetEntry({
  onSubmit,
}: {
  onSubmit: (entries: TimesheetEntry[]) => void
}) {
  const weekDays = useMemo(currentWeekDays, [])
  const [rows, setRows] = useState<EntryRow[]>([blankRow()])

  const grandTotal = rows.reduce((s, r) => s + rowTotal(r), 0)

  const patchRow = (id: string, patch: Partial<EntryRow>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))

  const setHour = (id: string, dayIdx: number, value: string) =>
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, hours: r.hours.map((h, i) => (i === dayIdx ? value : h)) }
          : r
      )
    )

  const removeRow = (id: string) =>
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev))

  const copyPreviousWeek = () => {
    setRows(previousWeekTimesheetRows.map(seedToRow))
    toast.success(
      `Copied ${previousWeekTimesheetRows.length} rows from last week's timesheet — adjust hours before submitting`
    )
  }

  const importRows = () => {
    const imported = importedTimesheetRows.map(seedToRow)
    setRows((prev) => [
      ...prev.filter((r) => r.task.trim() !== '' || rowTotal(r) > 0),
      ...imported,
    ])
    toast.success(
      `Imported ${imported.length} rows from the project tracker export`
    )
  }

  const submitForApproval = () => {
    const activeRows = rows.filter((r) => rowTotal(r) > 0)
    if (activeRows.length === 0) {
      toast.error('Enter hours on at least one row before submitting')
      return
    }
    const missingTask = activeRows.find((r) => r.task.trim() === '')
    if (missingTask) {
      toast.error('Every row with hours needs a task description')
      return
    }
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
    const entries: TimesheetEntry[] = activeRows.flatMap((r) =>
      weekDays
        .map((date, dayIdx) => ({ date, hours: parseHours(r.hours[dayIdx]) }))
        .filter((d) => d.hours > 0)
        .map((d) => ({
          id: `ts-${crypto.randomUUID().slice(0, 6)}`,
          date: d.date,
          project: r.project,
          task: `${r.task} (${r.typeOfWork})`,
          hours: d.hours,
          billable: isBillableWork(r.project, r.typeOfWork),
          status: 'submitted' as const,
          lastUpdated: now,
        }))
    )
    onSubmit(entries)
    setRows([blankRow()])
    toast.success(
      `Timesheet submitted for approval — ${entries.length} entries (${fmtHours(grandTotal)}) routed to your supervisor; you'll be notified once approved`
    )
  }

  return (
    <div className='w-full space-y-4'>
      <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
        <div>
          <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
            Weekly Entry — {fmtDate(weekDays[0])} to {fmtDate(weekDays[6])}
          </h2>
          <span className='text-neutral-1000 text-xs'>
            log hours per project and type of work, then submit the week for
            approval
          </span>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Button variant='outline' className='h-7 gap-1' onClick={copyPreviousWeek}>
            <CopySimple size={14} weight='bold' />
            Copy Previous Week
          </Button>
          <Button variant='outline' className='h-7 gap-1' onClick={importRows}>
            <FileArrowUp size={14} weight='bold' />
            Import
          </Button>
        </div>
      </div>

      <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='text-neutral-1000 border-b text-left text-xs'>
              <th className='py-2 pr-3 font-medium'>Project</th>
              <th className='px-2 font-medium'>Task</th>
              <th className='px-2 font-medium'>Type of work</th>
              {ENTRY_DAY_LABELS.map((label, i) => (
                <th key={label} className='px-1 text-center font-medium'>
                  {label}
                  <span className='block font-normal'>
                    {weekDays[i].slice(8)}
                  </span>
                </th>
              ))}
              <th className='px-2 text-right font-medium'>Total</th>
              <th className='px-2 font-medium'>
                <span className='sr-only'>Remove</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className='border-b last:border-0'>
                <td className='py-2 pr-3'>
                  <Select
                    value={row.project}
                    onValueChange={(v) => patchRow(row.id, { project: v })}
                  >
                    <SelectTrigger variant='secondary' className='h-7 w-[160px]'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMESHEET_PROJECTS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className='px-2'>
                  <Input
                    value={row.task}
                    onChange={(e) => patchRow(row.id, { task: e.target.value })}
                    placeholder='What did you work on?'
                    className='h-7 min-w-[160px]'
                    aria-label='Task description'
                  />
                </td>
                <td className='px-2'>
                  <Select
                    value={row.typeOfWork}
                    onValueChange={(v) =>
                      patchRow(row.id, { typeOfWork: v as TypeOfWork })
                    }
                  >
                    <SelectTrigger variant='secondary' className='h-7 w-[140px]'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPES_OF_WORK.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                {row.hours.map((h, dayIdx) => (
                  <td key={dayIdx} className='px-1'>
                    <Input
                      type='number'
                      min={0}
                      max={24}
                      step={0.5}
                      value={h}
                      onChange={(e) => setHour(row.id, dayIdx, e.target.value)}
                      className='h-7 w-14 text-center'
                      aria-label={`${ENTRY_DAY_LABELS[dayIdx]} hours`}
                    />
                  </td>
                ))}
                <td className='px-2 text-right font-medium'>
                  {fmtHours(rowTotal(row))}
                </td>
                <td className='px-2'>
                  <Button
                    variant='icon2'
                    className='text-neutral-1900 h-7 w-7'
                    disabled={rows.length === 1}
                    onClick={() => removeRow(row.id)}
                    aria-label='Remove row'
                  >
                    <Trash size={16} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className='border-t'>
              <td colSpan={10} className='py-2 pr-2 text-right text-xs font-medium'>
                Week total
              </td>
              <td className='px-2 text-right font-medium'>{fmtHours(grandTotal)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      <div className='flex flex-wrap items-center justify-between gap-2'>
        <Button
          variant='outline'
          className='h-7 gap-1'
          onClick={() => setRows((prev) => [...prev, blankRow()])}
        >
          <Plus size={12} weight='bold' />
          Add Row
        </Button>
        <Button className='h-7 gap-1' onClick={submitForApproval}>
          <PaperPlaneTilt size={14} weight='bold' />
          Submit for Approval
        </Button>
      </div>
      <p className='text-paragraph-sm text-neutral-1000'>
        Submitted entries appear under Saved Entries as “Awaiting approval”
        and route to your supervisor; billable classification follows the
        project and type of work.
      </p>
    </div>
  )
}
