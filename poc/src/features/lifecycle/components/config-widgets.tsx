import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

/** White card wrapper for a configuration section. */
export function SectionCard({
  title,
  description,
  actions,
  children,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className='mb-4 rounded-[6px] border border-gray-200 bg-white p-4'>
      <div className='mb-3 flex items-start justify-between gap-3'>
        <div>
          <h3 className='text-neutral-1600 text-sm font-semibold'>{title}</h3>
          {description && (
            <p className='text-neutral-1000 mt-0.5 text-xs'>{description}</p>
          )}
        </div>
        {actions && <div className='flex shrink-0 gap-2'>{actions}</div>}
      </div>
      {children}
    </section>
  )
}

/** Multi-select rendered as a wrap of checkboxes (locations, departments…). */
export function CheckboxGroup({
  options,
  value,
  onChange,
}: {
  options: readonly string[]
  value: string[]
  onChange: (next: string[]) => void
}) {
  return (
    <div className='flex flex-wrap gap-x-4 gap-y-1.5'>
      {options.map((option) => (
        <label key={option} className='flex items-center gap-1.5 text-sm'>
          <Checkbox
            variant='blue'
            checked={value.includes(option)}
            onCheckedChange={(checked) =>
              onChange(
                checked
                  ? [...value, option]
                  : value.filter((v) => v !== option)
              )
            }
          />
          {option}
        </label>
      ))}
    </div>
  )
}

/** Item count + Previous/Next pager for configuration list tables. */
export function ListPagination({
  total,
  page,
  pageSize,
  onPageChange,
}: {
  total: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(total, page * pageSize)
  return (
    <div className='mt-3 flex flex-wrap items-center justify-between gap-2'>
      <p className='text-neutral-1000 text-xs'>
        Showing {start}–{end} of {total} record(s)
      </p>
      <div className='flex items-center gap-2'>
        <Button
          size='sm'
          variant='outline'
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <span className='text-neutral-1000 text-xs'>
          Page {page} of {pages}
        </span>
        <Button
          size='sm'
          variant='outline'
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

/** Slice helper so paged tables never render an out-of-range page. */
export function pageSlice<T>(items: T[], page: number, pageSize: number): T[] {
  return items.slice((page - 1) * pageSize, page * pageSize)
}

/** Confirm-before-delete dialog shared by the config record tables. */
export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className='text-neutral-1000 text-sm'>{description}</p>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant='destructive'
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Compact chip list for string arrays inside tables. */
export function ChipList({ items }: { items: string[] }) {
  if (items.length === 0)
    return <span className='text-neutral-1000 text-xs'>—</span>
  return (
    <div className='flex max-w-[260px] flex-wrap gap-1'>
      {items.map((item) => (
        <Badge key={item} variant='outline' className='text-[11px]'>
          {item}
        </Badge>
      ))}
    </div>
  )
}
