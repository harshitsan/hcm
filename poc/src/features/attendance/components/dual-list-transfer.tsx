import { useState } from 'react'
import { CaretLeft, CaretRight } from 'phosphor-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

/**
 * Kensium-style dual-list transfer control (FSS-05 / OT-03): tick items in
 * either list and move them across with the arrow buttons to define the
 * assigned scope. Purely presentational — the caller owns the assigned list.
 */
export function DualListTransfer({
  options,
  assigned,
  onChange,
  availableTitle = 'Available',
  assignedTitle = 'Assigned',
}: {
  options: readonly string[]
  assigned: string[]
  onChange: (assigned: string[]) => void
  availableTitle?: string
  assignedTitle?: string
}) {
  const [checkedLeft, setCheckedLeft] = useState<string[]>([])
  const [checkedRight, setCheckedRight] = useState<string[]>([])

  const available = options.filter((o) => !assigned.includes(o))

  const moveRight = () => {
    if (checkedLeft.length === 0) return
    onChange([...assigned, ...checkedLeft.filter((c) => !assigned.includes(c))])
    setCheckedLeft([])
  }

  const moveLeft = () => {
    if (checkedRight.length === 0) return
    onChange(assigned.filter((a) => !checkedRight.includes(a)))
    setCheckedRight([])
  }

  const list = (
    title: string,
    items: string[],
    checked: string[],
    setChecked: (v: string[]) => void
  ) => (
    <div className='flex-1 rounded-[6px] border border-gray-200'>
      <Label className='text-neutral-1000 block border-b border-gray-200 px-3 py-1.5 text-xs'>
        {title} ({items.length})
      </Label>
      <div className='max-h-44 space-y-1 overflow-y-auto p-2'>
        {items.map((item) => (
          <label key={item} className='flex items-center gap-2 rounded px-1 py-0.5 text-sm'>
            <Checkbox
              variant='blue'
              checked={checked.includes(item)}
              onCheckedChange={(v) =>
                setChecked(v ? [...checked, item] : checked.filter((c) => c !== item))
              }
            />
            {item}
          </label>
        ))}
        {items.length === 0 && (
          <p className='text-neutral-1000 px-1 py-0.5 text-xs'>None</p>
        )}
      </div>
    </div>
  )

  return (
    <div className='flex items-stretch gap-2'>
      {list(availableTitle, available, checkedLeft, setCheckedLeft)}
      <div className='flex flex-col justify-center gap-2'>
        <Button
          type='button'
          variant='outline'
          className='h-7 px-2'
          onClick={moveRight}
          disabled={checkedLeft.length === 0}
          aria-label='Move selected to assigned'
        >
          <CaretRight size={12} weight='bold' />
        </Button>
        <Button
          type='button'
          variant='outline'
          className='h-7 px-2'
          onClick={moveLeft}
          disabled={checkedRight.length === 0}
          aria-label='Move selected to available'
        >
          <CaretLeft size={12} weight='bold' />
        </Button>
      </div>
      {list(assignedTitle, assigned, checkedRight, setCheckedRight)}
    </div>
  )
}
