import { useState } from 'react'
import { Button } from '@/components/ui/button'
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
  applied: AnnouncementFilters
  onSearch: (filters: AnnouncementFilters) => void
  onReset: () => void
}

/**
 * Period + status search with Reset (ANN-34/35) and a "Pending with me"
 * approver queue toggle (ANN-25). Filters apply on Search, not while typing.
 */
export function AnnouncementFiltersBar({
  applied,
  onSearch,
  onReset,
}: AnnouncementFiltersBarProps) {
  const [draft, setDraft] = useState<AnnouncementFilters>(applied)

  const handleReset = () => {
    setDraft(EMPTY_FILTERS)
    onReset()
  }

  return (
    <div className='border-grey-200 mb-3 flex flex-wrap items-end gap-3 rounded-[6px] border bg-white px-3 py-2.5'>
      <div className='flex flex-col gap-1'>
        <Label htmlFor='ann-filter-from' className='text-paragraph-sm'>
          Period from
        </Label>
        <Input
          id='ann-filter-from'
          type='date'
          value={draft.from}
          onChange={(e) => setDraft({ ...draft, from: e.target.value })}
          className='h-7 w-[150px]'
        />
      </div>
      <div className='flex flex-col gap-1'>
        <Label htmlFor='ann-filter-to' className='text-paragraph-sm'>
          Period to
        </Label>
        <Input
          id='ann-filter-to'
          type='date'
          value={draft.to}
          onChange={(e) => setDraft({ ...draft, to: e.target.value })}
          className='h-7 w-[150px]'
        />
      </div>
      <div className='flex flex-col gap-1'>
        <Label className='text-paragraph-sm'>Status</Label>
        <Select
          value={draft.status}
          onValueChange={(status) => setDraft({ ...draft, status })}
        >
          <SelectTrigger className='h-7! w-[180px]'>
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
      </div>
      <div className='mb-1 flex items-center gap-2'>
        <Switch
          id='ann-pending-with-me'
          checked={draft.pendingWithMe}
          onCheckedChange={(pendingWithMe) => {
            const next = { ...draft, pendingWithMe }
            setDraft(next)
            onSearch(next)
          }}
        />
        <Label htmlFor='ann-pending-with-me' className='text-paragraph-sm'>
          Pending with me
        </Label>
      </div>
      <div className='ms-auto flex items-center gap-2'>
        <Button
          variant='outline'
          className='h-7 rounded-[6px] px-2.5'
          onClick={handleReset}
        >
          Reset
        </Button>
        <Button
          className='h-7 rounded-[6px] px-2.5'
          onClick={() => onSearch(draft)}
        >
          Search
        </Button>
      </div>
    </div>
  )
}
