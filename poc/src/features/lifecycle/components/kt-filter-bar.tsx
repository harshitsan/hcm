import { useMemo, useState } from 'react'
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
import { KT_STATUSES, type KtTask } from '../data/knowledge-transfer'
import { DEPARTMENTS } from '../data/shared'

export interface KtFilters {
  employeeState: 'all' | 'active' | 'inactive'
  from: string
  to: string
  department: string
  status: string
}

export const EMPTY_KT_FILTERS: KtFilters = {
  employeeState: 'all',
  from: '',
  to: '',
  department: 'all',
  status: 'all',
}

/**
 * Applies the shared KT filters to a task list. `person` picks which side of
 * the handover the active / inactive filter inspects.
 */
export function useKtFiltered(
  tasks: KtTask[],
  filters: KtFilters,
  person: 'provider' | 'receiver' | 'either'
) {
  return useMemo(
    () =>
      tasks.filter((t) => {
        const activeFlags =
          person === 'provider'
            ? [t.providerActive]
            : person === 'receiver'
              ? [t.receiverActive]
              : [t.providerActive, t.receiverActive]
        const stateOk =
          filters.employeeState === 'all' ||
          (filters.employeeState === 'active'
            ? activeFlags.some(Boolean)
            : activeFlags.some((a) => !a))
        return (
          stateOk &&
          (filters.from === '' || t.endDate >= filters.from) &&
          (filters.to === '' || t.startDate <= filters.to) &&
          (filters.department === 'all' || t.department === filters.department) &&
          (filters.status === 'all' || t.status === filters.status)
        )
      }),
    [filters, person, tasks]
  )
}

interface KtFilterBarProps {
  filters: KtFilters
  onChange: (next: KtFilters) => void
  /** Row count after filtering, echoed by the Search action. */
  matchCount: number
  /** Extra controls (e.g. Refresh) rendered after Search / Reset. */
  children?: React.ReactNode
}

/**
 * Shared KT filter rail — active / inactive employees, From / To period,
 * department and KT status with explicit Search and Reset actions.
 */
export function KtFilterBar({
  filters,
  onChange,
  matchCount,
  children,
}: KtFilterBarProps) {
  const [dirty, setDirty] = useState(false)

  const set = (patch: Partial<KtFilters>) => {
    setDirty(true)
    onChange({ ...filters, ...patch })
  }

  return (
    <div className='mb-3 flex flex-wrap items-center gap-2'>
      <Select
        value={filters.employeeState}
        onValueChange={(v) => set({ employeeState: v as KtFilters['employeeState'] })}
      >
        <SelectTrigger variant='secondary' className='h-7 w-[170px]'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>All employees</SelectItem>
          <SelectItem value='active'>Active employees</SelectItem>
          <SelectItem value='inactive'>Inactive employees</SelectItem>
        </SelectContent>
      </Select>
      <Input
        type='date'
        value={filters.from}
        onChange={(e) => set({ from: e.target.value })}
        className='h-7 w-[150px]'
        aria-label='Period from'
      />
      <Input
        type='date'
        value={filters.to}
        onChange={(e) => set({ to: e.target.value })}
        className='h-7 w-[150px]'
        aria-label='Period to'
      />
      <Select
        value={filters.department}
        onValueChange={(v) => set({ department: v })}
      >
        <SelectTrigger variant='secondary' className='h-7 w-[160px]'>
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
      <Select value={filters.status} onValueChange={(v) => set({ status: v })}>
        <SelectTrigger variant='secondary' className='h-7 w-[150px]'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>All statuses</SelectItem>
          {KT_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        size='sm'
        onClick={() =>
          toast.info(`${matchCount} KT task(s) match the current filters`)
        }
      >
        Search
      </Button>
      <Button
        size='sm'
        variant='outline'
        onClick={() => {
          setDirty(false)
          onChange(EMPTY_KT_FILTERS)
          toast.info('KT filters cleared — showing all tasks')
        }}
        disabled={
          !dirty &&
          filters.employeeState === 'all' &&
          filters.department === 'all' &&
          filters.status === 'all' &&
          filters.from === '' &&
          filters.to === ''
        }
      >
        Reset
      </Button>
      {children}
    </div>
  )
}
