import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { type Jurisdiction } from '../data/jurisdictions'
import { TypeBadge } from './jurisdiction-badges'

interface JurisdictionPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  /** Only active supported catalog entries are offered (JUR-06/07/09/11). */
  catalog: Jurisdiction[]
  selectedIds: string[]
  /** Return false to keep the dialog open (e.g. minimum-one violation). */
  onSave: (ids: string[]) => boolean
}

/**
 * Multi-select over the single supported catalog. Used for company
 * assignments (JUR-06/09) and policy applicability criteria (JUR-05) so
 * every module draws from the same governed entries (JUR-07).
 */
export function JurisdictionPickerDialog({
  open,
  onOpenChange,
  title,
  description,
  catalog,
  selectedIds,
  onSave,
}: JurisdictionPickerDialogProps) {
  const [ids, setIds] = useState<string[]>(selectedIds)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (open) {
      setIds(selectedIds)
      setQuery('')
    }
  }, [open, selectedIds])

  const options = catalog
    .filter((j) => j.status === 'active')
    .filter((j) => j.name.toLowerCase().includes(query.trim().toLowerCase()))

  const toggle = (id: string) =>
    setIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[440px]'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Input
          placeholder='Search catalog…'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className='max-h-[280px] space-y-1 overflow-y-auto rounded-md border border-gray-200 p-2'>
          {options.length === 0 && (
            <p className='text-paragraph-sm text-neutral-1000 px-1 py-2'>
              No supported catalog entries match.
            </p>
          )}
          {options.map((j) => (
            <label
              key={j.id}
              className='hover:bg-neutral-200 flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5'
            >
              <Checkbox
                variant='blue'
                checked={ids.includes(j.id)}
                onCheckedChange={() => toggle(j.id)}
              />
              <span className='text-neutral-1600 flex-1 text-sm font-medium'>
                {j.name}
                <span className='text-neutral-1000 ml-1 text-xs'>{j.code}</span>
              </span>
              <TypeBadge type={j.type} />
            </label>
          ))}
        </div>
        <p className='text-paragraph-sm text-neutral-1000'>
          {ids.length} selected — only supported catalog entries can be
          assigned.
        </p>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (onSave(ids)) onOpenChange(false)
            }}
          >
            Save selection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
