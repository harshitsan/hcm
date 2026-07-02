import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  SUPPORTED_ENTITIES,
  type FieldDefinition,
  type SupportedEntity,
} from '../data/custom-fields'
import { TypeBadge } from './field-badges'

interface FieldsOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fields: FieldDefinition[]
  onSave: (orderedIds: string[]) => void
}

/**
 * "Fields Order" — rearrange the sequence custom fields render in on forms,
 * grids, and detail views for a chosen entity.
 */
export function FieldsOrderDialog({
  open,
  onOpenChange,
  fields,
  onSave,
}: FieldsOrderDialogProps) {
  const [entity, setEntity] = useState<SupportedEntity>('Employees')
  const [ordered, setOrdered] = useState<FieldDefinition[]>([])

  const entityFields = useMemo(
    () =>
      fields
        .filter((f) => f.entity === entity)
        .sort((a, b) => a.order - b.order),
    [fields, entity]
  )

  useEffect(() => {
    if (open) setOrdered(entityFields)
  }, [open, entityFields])

  const move = (index: number, delta: -1 | 1) => {
    setOrdered((prev) => {
      const next = [...prev]
      const target = index + delta
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[480px]'>
        <DialogHeader>
          <DialogTitle>Fields Order</DialogTitle>
          <DialogDescription>
            Rearrange how custom fields appear on forms and detail views.
            Without an explicit order a deterministic default is used.
          </DialogDescription>
        </DialogHeader>

        <Select
          value={entity}
          onValueChange={(v) => setEntity(v as SupportedEntity)}
        >
          <SelectTrigger variant='secondary' className='w-full'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_ENTITIES.map((e) => (
              <SelectItem key={e} value={e}>
                {e}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className='max-h-[320px] space-y-1.5 overflow-y-auto'>
          {ordered.map((f, i) => (
            <div
              key={f.id}
              className='flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-1.5'
            >
              <div className='flex min-w-0 items-center gap-2'>
                <span className='text-neutral-1000 w-5 text-sm'>{i + 1}.</span>
                <span className='truncate text-sm font-medium'>{f.name}</span>
                <TypeBadge type={f.type} />
              </div>
              <div className='flex items-center gap-1'>
                <Button
                  variant='icon2'
                  className='h-6 w-6'
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                  aria-label={`Move ${f.name} up`}
                >
                  <ArrowUp className='size-3.5' />
                </Button>
                <Button
                  variant='icon2'
                  className='h-6 w-6'
                  disabled={i === ordered.length - 1}
                  onClick={() => move(i, 1)}
                  aria-label={`Move ${f.name} down`}
                >
                  <ArrowDown className='size-3.5' />
                </Button>
              </div>
            </div>
          ))}
          {ordered.length === 0 && (
            <p className='text-neutral-1000 py-6 text-center text-sm'>
              No custom fields on {entity} yet.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSave(ordered.map((f) => f.id))
              onOpenChange(false)
            }}
          >
            Save order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
