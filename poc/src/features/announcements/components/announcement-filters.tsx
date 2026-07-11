import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ANNOUNCEMENT_STATUSES } from '../data/announcements'

export interface AnnouncementFilters {
  from: string
  to: string
  status: string
  pendingWithMe: boolean
}

export const EMPTY_FILTERS: AnnouncementFilters = {
  from: '',
  to: '',
  status: 'All',
  pendingWithMe: false,
}

interface AnnouncementFiltersBarProps {
  value: AnnouncementFilters
  onChange: (filters: AnnouncementFilters) => void
}

/**
 * Canonical instant-apply filter toolbar (period + status, ANN-34/35) with a
 * "Pending with me" approver queue toggle (ANN-25). Every control applies on
 * change — no Search/Reset buttons.
 */
export function AnnouncementFiltersBar({
  value,
  onChange,
}: AnnouncementFiltersBarProps) {
  return (
    <div className='mb-3 flex flex-wrap items-center gap-2'>
      <div className='flex items-center gap-1.5'>
        <Label
          htmlFor='ann-filter-from'
          className='text-paragraph-sm text-neutral-1000 font-normal'
        >
          From
        </Label>
        <Input
          id='ann-filter-from'
          type='date'
          value={value.from}
          onChange={(e) => onChange({ ...value, from: e.target.value })}
          className='h-7 w-[140px]'
        />
      </div>
      <div className='flex items-center gap-1.5'>
        <Label
          htmlFor='ann-filter-to'
          className='text-paragraph-sm text-neutral-1000 font-normal'
        >
          To
        </Label>
        <Input
          id='ann-filter-to'
          type='date'
          value={value.to}
          onChange={(e) => onChange({ ...value, to: e.target.value })}
          className='h-7 w-[140px]'
        />
      </div>
      <Select
        value={value.status}
        onValueChange={(status) => onChange({ ...value, status })}
      >
        <SelectTrigger
          variant='secondary'
          className='h-7 w-fit min-w-[150px] text-sm'
          aria-label='Status'
        >
          <span className='text-neutral-1000 mr-1'>Status:</span>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='All'>All</SelectItem>
          {ANNOUNCEMENT_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className='flex items-center gap-2'>
        <Switch
          id='ann-pending-with-me'
          checked={value.pendingWithMe}
          onCheckedChange={(pendingWithMe) =>
            onChange({ ...value, pendingWithMe })
          }
        />
        <Label htmlFor='ann-pending-with-me' className='text-paragraph-sm'>
          Pending with me
        </Label>
      </div>
    </div>
  )
}
