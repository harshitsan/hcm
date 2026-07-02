import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EMPTY_FILTER, type PeriodStatusFilter } from './utils'

/** Summary count cards shown above each list, mirroring the users module. */
export function SummaryCards({
  title,
  items,
}: {
  title: string
  items: { label: string; value: number | string }[]
}) {
  return (
    <Card className='bg-blue-150 mb-4 w-full gap-2 border-none py-2'>
      <CardHeader className='flex items-center justify-between px-0 pb-2'>
        <CardTitle className='text-paragraph-sm text-neutral-1600 font-medium'>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className='p-0 pt-0'>
        <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
          {items.map((item) => (
            <div
              key={item.label}
              className='flex items-center rounded-[6px] border border-gray-200 bg-white px-3 py-1.5'
            >
              <div className='flex flex-col gap-3'>
                <span className='text-paragraph-sm font-medium text-black'>
                  {item.label}
                </span>
                <span className='text-2xl font-medium text-black'>
                  {typeof item.value === 'number'
                    ? item.value.toLocaleString('en-US')
                    : item.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Period From/To + status filter bar shared by every request list
 * (ESS-18/20/21/22/26/28/29/31 filtering criteria).
 */
export function FilterBar({
  statuses,
  value,
  onChange,
  children,
}: {
  statuses: readonly string[]
  value: PeriodStatusFilter
  onChange: (next: PeriodStatusFilter) => void
  children?: React.ReactNode
}) {
  return (
    <div className='mb-3 flex flex-wrap items-center gap-2'>
      <span className='text-paragraph-sm text-neutral-1000'>Period</span>
      <Input
        type='date'
        aria-label='Period from'
        value={value.from}
        onChange={(e) => onChange({ ...value, from: e.target.value })}
        className='h-8 w-[150px] bg-white'
      />
      <span className='text-paragraph-sm text-neutral-1000'>to</span>
      <Input
        type='date'
        aria-label='Period to'
        value={value.to}
        onChange={(e) => onChange({ ...value, to: e.target.value })}
        className='h-8 w-[150px] bg-white'
      />
      <Select
        value={value.status}
        onValueChange={(status) => onChange({ ...value, status })}
      >
        <SelectTrigger className='h-8 w-[230px] bg-white'>
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
      {children}
      <Button
        variant='outline'
        className='h-8 rounded-[6px] px-3'
        onClick={() => onChange(EMPTY_FILTER)}
      >
        Reset
      </Button>
    </div>
  )
}
