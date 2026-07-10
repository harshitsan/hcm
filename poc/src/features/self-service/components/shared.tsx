import { CaretLeft, CaretRight, PencilSimple, Trash } from 'phosphor-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
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

/** Compact pencil icon button used in admin config tables. */
export function EditIconButton({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <Button
      variant='outline'
      className='h-7 w-7 rounded-[6px] p-0'
      aria-label={label}
      onClick={onClick}
    >
      <PencilSimple size={13} weight='bold' />
    </Button>
  )
}

/** Trash icon button that asks for confirmation before deleting a record. */
export function DeleteConfirmButton({
  title,
  description,
  onConfirm,
}: {
  title: string
  description: string
  onConfirm: () => void
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant='outline'
          className='h-7 w-7 rounded-[6px] p-0'
          aria-label={`Delete ${title}`}
        >
          <Trash size={13} weight='bold' />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {title}?</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/** Prev/Next pager used by the longer admin config lists. */
export function Pager({
  page,
  pageCount,
  onChange,
}: {
  page: number
  pageCount: number
  onChange: (page: number) => void
}) {
  if (pageCount <= 1) return null
  return (
    <div className='mt-3 flex items-center justify-end gap-2'>
      <Button
        variant='outline'
        className='h-7 gap-1 rounded-[6px] px-2'
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        <CaretLeft size={13} weight='bold' />
        Prev
      </Button>
      <span className='text-paragraph-sm text-neutral-1000'>
        Page {page} of {pageCount}
      </span>
      <Button
        variant='outline'
        className='h-7 gap-1 rounded-[6px] px-2'
        disabled={page >= pageCount}
        onClick={() => onChange(page + 1)}
      >
        Next
        <CaretRight size={13} weight='bold' />
      </Button>
    </div>
  )
}
