import { useState } from 'react'
import { MagnifyingGlass } from 'phosphor-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EMPLOYEE_STATES, TEAM_DEPARTMENTS } from '../data/travel-team'

/**
 * Filter criteria shared by the manager/coordinator travel lists:
 * employee state, period, department, status and (optionally) amount
 * (EAE-02..05, EE-02..06, ETR-02..05, TD-02..05).
 */
export interface TeamFilter {
  employeeState: string
  from: string
  to: string
  department: string
  status: string
  /** Exact amount match; empty = no amount filtering. */
  amount: string
}

export const EMPTY_TEAM_FILTER: TeamFilter = {
  employeeState: 'All',
  from: '',
  to: '',
  department: 'All',
  status: 'All',
  amount: '',
}

/** Applies the team filter over rows exposing the filterable attributes. */
export function applyTeamFilter<T>(
  rows: T[],
  filter: TeamFilter,
  get: {
    date: (row: T) => string
    status: (row: T) => string
    department: (row: T) => string
    employeeState: (row: T) => string
    amount?: (row: T) => number
  }
): T[] {
  return rows.filter((row) => {
    const date = get.date(row).slice(0, 10)
    if (filter.from && date < filter.from) return false
    if (filter.to && date > filter.to) return false
    if (filter.status !== 'All' && get.status(row) !== filter.status)
      return false
    if (filter.department !== 'All' && get.department(row) !== filter.department)
      return false
    if (
      filter.employeeState !== 'All' &&
      get.employeeState(row) !== filter.employeeState
    )
      return false
    if (filter.amount && get.amount && get.amount(row) !== Number(filter.amount))
      return false
    return true
  })
}

/**
 * Draft-based filter bar: criteria are staged and only applied on Search,
 * Reset clears both the draft and the applied filter
 * (EAE-06, EE-07, ETR-07, TD-07).
 */
export function TeamFilterBar({
  statuses,
  value,
  onChange,
  showAmount = false,
  children,
}: {
  statuses: readonly string[]
  value: TeamFilter
  onChange: (next: TeamFilter) => void
  showAmount?: boolean
  children?: React.ReactNode
}) {
  const [draft, setDraft] = useState<TeamFilter>(value)

  return (
    <div className='mb-3 flex flex-wrap items-center gap-2'>
      <Select
        value={draft.employeeState}
        onValueChange={(employeeState) => setDraft({ ...draft, employeeState })}
      >
        <SelectTrigger
          aria-label='Employee state'
          className='h-8 w-[170px] bg-white'
        >
          <SelectValue placeholder='Employee state' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='All'>Active & inactive</SelectItem>
          {EMPLOYEE_STATES.map((s) => (
            <SelectItem key={s} value={s}>
              {s} employees
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className='text-paragraph-sm text-neutral-1000'>Period</span>
      <Input
        type='date'
        aria-label='Period from'
        value={draft.from}
        onChange={(e) => setDraft({ ...draft, from: e.target.value })}
        className='h-8 w-[145px] bg-white'
      />
      <span className='text-paragraph-sm text-neutral-1000'>to</span>
      <Input
        type='date'
        aria-label='Period to'
        value={draft.to}
        onChange={(e) => setDraft({ ...draft, to: e.target.value })}
        className='h-8 w-[145px] bg-white'
      />

      <Select
        value={draft.department}
        onValueChange={(department) => setDraft({ ...draft, department })}
      >
        <SelectTrigger aria-label='Department' className='h-8 w-[170px] bg-white'>
          <SelectValue placeholder='Department' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='All'>All departments</SelectItem>
          {TEAM_DEPARTMENTS.map((d) => (
            <SelectItem key={d} value={d}>
              {d}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={draft.status}
        onValueChange={(status) => setDraft({ ...draft, status })}
      >
        <SelectTrigger aria-label='Status' className='h-8 w-[230px] bg-white'>
          <SelectValue placeholder='Status' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='All'>All statuses</SelectItem>
          {statuses.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showAmount && (
        <Input
          type='number'
          aria-label='Amount'
          placeholder='Amount (₹)'
          value={draft.amount}
          onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
          className='h-8 w-[120px] bg-white'
        />
      )}

      <Button
        className='h-8 gap-1 rounded-[6px] px-3'
        onClick={() => onChange(draft)}
      >
        <MagnifyingGlass size={12} weight='bold' />
        Search
      </Button>
      <Button
        variant='outline'
        className='h-8 rounded-[6px] px-3'
        onClick={() => {
          setDraft(EMPTY_TEAM_FILTER)
          onChange(EMPTY_TEAM_FILTER)
        }}
      >
        Reset
      </Button>
      {children}
    </div>
  )
}
