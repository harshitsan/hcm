import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
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
import { type Asset } from '../data/assets'
import { type Requisition } from '../data/requisitions'

interface AssignDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  requisition: Requisition | null
  /** Issuable stock in the requisition's category. */
  availableAssets: Asset[]
  onAssign: (requisition: Requisition, assets: Asset[]) => void
}

/**
 * Assign specific asset units against an approved requisition (ASM-31).
 * Issuing fewer units than requested leaves the balance open as
 * Pending for Partial Issuance.
 */
export function AssignDialog({
  open,
  onOpenChange,
  requisition,
  availableAssets,
  onAssign,
}: AssignDialogProps) {
  const [selected, setSelected] = useState<string[]>([])

  useEffect(() => {
    if (open) setSelected([])
  }, [open])

  const remaining = useMemo(
    () => (requisition ? requisition.quantity - requisition.issuedQuantity : 0),
    [requisition]
  )

  if (!requisition) return null

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= remaining) {
        toast.error(`Only ${remaining} unit(s) remain open on this requisition`)
        return prev
      }
      return [...prev, id]
    })
  }

  const handleAssign = () => {
    if (selected.length === 0) {
      toast.error('Select at least one asset unit to issue')
      return
    }
    const units = availableAssets.filter((a) => selected.includes(a.id))
    onAssign(requisition, units)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[480px]'>
        <DialogHeader>
          <DialogTitle>Assign assets — {requisition.number}</DialogTitle>
          <DialogDescription>
            {requisition.requesterName} requested {requisition.quantity} ×{' '}
            {requisition.assetName} ({requisition.category}). Issued so far:{' '}
            {requisition.issuedQuantity}. Balance open: {remaining}. Issuing fewer than the
            balance keeps the requisition Pending for Partial Issuance.
          </DialogDescription>
        </DialogHeader>

        <div className='max-h-[300px] space-y-2 overflow-y-auto'>
          {availableAssets.length === 0 ? (
            <p className='text-paragraph-sm text-neutral-1000 py-4 text-center'>
              No Available stock in {requisition.category} — record a new asset arrival or
              free up units first.
            </p>
          ) : (
            availableAssets.map((a) => (
              <label
                key={a.id}
                className='border-grey-200 flex cursor-pointer items-center gap-3 rounded-[6px] border bg-white p-2.5'
              >
                <Checkbox
                  variant='blue'
                  checked={selected.includes(a.id)}
                  onCheckedChange={() => toggle(a.id)}
                />
                <div className='flex flex-col'>
                  <span className='text-neutral-1600 text-sm font-medium'>
                    {a.assetTag} · {a.name}
                  </span>
                  <span className='text-paragraph-sm text-neutral-1000'>
                    Serial {a.serial} · {a.vendor}
                  </span>
                </div>
              </label>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={availableAssets.length === 0}>
            Issue {selected.length > 0 ? `${selected.length} unit(s)` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
