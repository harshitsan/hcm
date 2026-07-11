import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/helpers'

interface DualListPickerProps {
  label: string
  /** Full role catalog; anything not selected shows as available. */
  catalog: readonly string[]
  selected: string[]
  onChange: (selected: string[]) => void
}

function RoleList({
  title,
  roles,
  highlighted,
  onToggle,
}: {
  title: string
  roles: string[]
  highlighted: string | null
  onToggle: (role: string) => void
}) {
  return (
    <div className='border-gray-200 min-h-36 flex-1 rounded-[6px] border bg-white'>
      <p className='border-gray-200 text-neutral-1000 border-b px-2 py-1 text-xs font-medium'>
        {title} ({roles.length})
      </p>
      <ul className='max-h-40 overflow-y-auto p-1'>
        {roles.length === 0 && (
          <li className='text-neutral-1000 px-2 py-1 text-sm'>None</li>
        )}
        {roles.map((role) => (
          <li key={role}>
            <button
              type='button'
              onClick={() => onToggle(role)}
              className={cn(
                'w-full rounded px-2 py-1 text-left text-sm',
                highlighted === role
                  ? 'bg-blue-150 text-blue-1400'
                  : 'text-neutral-1900 hover:bg-neutral-200'
              )}
            >
              {role}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Available/Selected dual-list role picker with move-one and move-all
 * controls (>> > < <<), mirroring the Kensium receiver configuration
 * (FBG-23). Click a role to highlight it, then use &gt; / &lt; to move it.
 */
export function DualListPicker({
  label,
  catalog,
  selected,
  onChange,
}: DualListPickerProps) {
  const [highlighted, setHighlighted] = useState<string | null>(null)
  const available = catalog.filter((r) => !selected.includes(r))

  const moveOne = (toSelected: boolean) => {
    if (!highlighted) return
    if (toSelected && available.includes(highlighted)) {
      onChange([...selected, highlighted])
    } else if (!toSelected && selected.includes(highlighted)) {
      onChange(selected.filter((r) => r !== highlighted))
    }
    setHighlighted(null)
  }

  return (
    <div>
      <p className='text-neutral-1600 mb-1 text-sm font-medium'>{label}</p>
      <div className='flex items-stretch gap-2'>
        <RoleList
          title='Available roles'
          roles={available}
          highlighted={highlighted}
          onToggle={(r) => setHighlighted((h) => (h === r ? null : r))}
        />
        <div className='flex flex-col justify-center gap-1'>
          <Button type='button' variant='outline' className='h-7 w-9 px-0' aria-label='Select all' onClick={() => onChange([...catalog])}>
            »
          </Button>
          <Button type='button' variant='outline' className='h-7 w-9 px-0' aria-label='Select highlighted' onClick={() => moveOne(true)}>
            ›
          </Button>
          <Button type='button' variant='outline' className='h-7 w-9 px-0' aria-label='Remove highlighted' onClick={() => moveOne(false)}>
            ‹
          </Button>
          <Button type='button' variant='outline' className='h-7 w-9 px-0' aria-label='Remove all' onClick={() => onChange([])}>
            «
          </Button>
        </div>
        <RoleList
          title='Selected receivers'
          roles={selected}
          highlighted={highlighted}
          onToggle={(r) => setHighlighted((h) => (h === r ? null : r))}
        />
      </div>
    </div>
  )
}
