import { Button } from '@/components/ui/button'
import {
  DateRangePicker,
  type DateRange,
} from '@/components/ui/date-range-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AUDIT_ACTION_TYPES,
  AUDIT_ENTITY_TYPES,
  type AuditEntry,
} from '../data/audit-entries'

const ACTION_LABELS: Record<(typeof AUDIT_ACTION_TYPES)[number], string> = {
  create: 'Create',
  update: 'Update',
  delete: 'Delete',
  'status-change': 'Status change',
}

export interface AuditFilters {
  entityType: string
  actionType: string
  actor: string
  tier: string
  range: DateRange
}

// eslint-disable-next-line react-refresh/only-export-components
export const EMPTY_FILTERS: AuditFilters = {
  entityType: 'all',
  actionType: 'all',
  actor: 'all',
  tier: 'all',
  range: { from: undefined, to: undefined },
}

/** Applies the filter bar selections to a set of audit entries (FR 6.29.4). */
// eslint-disable-next-line react-refresh/only-export-components
export function applyFilters(
  entries: AuditEntry[],
  filters: AuditFilters
): AuditEntry[] {
  return entries.filter((e) => {
    if (filters.entityType !== 'all' && e.entityType !== filters.entityType)
      return false
    if (filters.actionType !== 'all' && e.actionType !== filters.actionType)
      return false
    if (filters.actor !== 'all' && e.actor !== filters.actor) return false
    if (filters.tier !== 'all' && e.storageTier !== filters.tier) return false
    const ts = new Date(e.timestamp)
    if (filters.range.from && ts < filters.range.from) return false
    if (filters.range.to) {
      const end = new Date(filters.range.to)
      end.setHours(23, 59, 59, 999)
      if (ts > end) return false
    }
    return true
  })
}

interface AuditFilterBarProps {
  filters: AuditFilters
  onChange: (filters: AuditFilters) => void
  actors: string[]
  /** Hide the entity-type filter (record history is already per-record). */
  showEntityFilter?: boolean
}

export function AuditFilterBar({
  filters,
  onChange,
  actors,
  showEntityFilter = true,
}: AuditFilterBarProps) {
  const set = (patch: Partial<AuditFilters>) =>
    onChange({ ...filters, ...patch })

  return (
    <div className='mb-3 flex flex-wrap items-center gap-2'>
      {showEntityFilter && (
        <Select
          value={filters.entityType}
          onValueChange={(v) => set({ entityType: v })}
        >
          <SelectTrigger variant='secondary' className='h-8 w-[140px]'>
            <SelectValue placeholder='Entity' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All entities</SelectItem>
            {AUDIT_ENTITY_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Select
        value={filters.actionType}
        onValueChange={(v) => set({ actionType: v })}
      >
        <SelectTrigger variant='secondary' className='h-8 w-[150px]'>
          <SelectValue placeholder='Action' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>All actions</SelectItem>
          {AUDIT_ACTION_TYPES.map((a) => (
            <SelectItem key={a} value={a}>
              {ACTION_LABELS[a]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.actor} onValueChange={(v) => set({ actor: v })}>
        <SelectTrigger variant='secondary' className='h-8 w-[200px]'>
          <SelectValue placeholder='Actor' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>All actors</SelectItem>
          {actors.map((a) => (
            <SelectItem key={a} value={a}>
              {a}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.tier} onValueChange={(v) => set({ tier: v })}>
        <SelectTrigger variant='secondary' className='h-8 w-[150px]'>
          <SelectValue placeholder='Storage' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>Active + archived</SelectItem>
          <SelectItem value='active'>Active store</SelectItem>
          <SelectItem value='archived'>Archived</SelectItem>
        </SelectContent>
      </Select>

      <DateRangePicker
        placeholder='Date range'
        selectedRange={filters.range}
        onRangeSelect={(range) => set({ range })}
        variant='secondary'
      />

      <Button
        variant='ghost'
        className='h-8 px-2 text-sm'
        onClick={() => onChange(EMPTY_FILTERS)}
      >
        Clear
      </Button>
    </div>
  )
}
