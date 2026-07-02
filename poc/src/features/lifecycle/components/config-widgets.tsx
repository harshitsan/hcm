import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'

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
