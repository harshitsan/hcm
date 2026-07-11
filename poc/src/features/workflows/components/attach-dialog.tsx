import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
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
import { MODULE_REGISTRY, submodulesFor } from '@/config/module-registry'
import type { ArtifactAttachment, TargetModule } from '@/features/workflows/data/business-logic'

export interface AttachDialogProps {
  artifact: { id: string; name: string }
  open: boolean
  onOpenChange: (open: boolean) => void
  onAttach: (attachment: ArtifactAttachment) => void
}

/** Modules that have a targetModule (engine surface) — the attach targets. */
const TARGET_MODULES_FROM_REGISTRY = MODULE_REGISTRY.filter(
  (m) => m.targetModule !== undefined
) as Array<typeof MODULE_REGISTRY[number] & { targetModule: TargetModule }>

/**
 * Attach dialog — two clicks max.
 *   1. Pick module from registry modules with a targetModule.
 *   2. Optionally pick a submodule (defaults to "Whole module").
 */
export function AttachDialog({ artifact, open, onOpenChange, onAttach }: AttachDialogProps) {
  const WHOLE_MODULE_SENTINEL = '__whole__'

  const [selectedTarget, setSelectedTarget] = useState<TargetModule | ''>('')
  const [selectedSubmodule, setSelectedSubmodule] = useState<string>(WHOLE_MODULE_SENTINEL)

  const submodules = selectedTarget
    ? submodulesFor(selectedTarget as TargetModule)
    : []

  function handleAttach() {
    if (!selectedTarget) return
    const submodule =
      selectedSubmodule && selectedSubmodule !== WHOLE_MODULE_SENTINEL
        ? selectedSubmodule
        : undefined
    const attachment: ArtifactAttachment = {
      module: selectedTarget as TargetModule,
      ...(submodule ? { submodule } : {}),
    }
    onAttach(attachment)
    onOpenChange(false)
    setSelectedTarget('')
    setSelectedSubmodule(WHOLE_MODULE_SENTINEL)
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setSelectedTarget('')
      setSelectedSubmodule(WHOLE_MODULE_SENTINEL)
    }
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-sm'>
        <DialogHeader>
          <DialogTitle>Attach "{artifact.name}"</DialogTitle>
        </DialogHeader>
        <div className='flex flex-col gap-4 py-2'>
          <div className='flex flex-col gap-1.5'>
            <label className='text-paragraph-sm text-neutral-1400 font-semibold'>
              Module
            </label>
            <Select
              value={selectedTarget}
              onValueChange={(v) => {
                setSelectedTarget(v as TargetModule)
                setSelectedSubmodule('')
              }}
            >
              <SelectTrigger variant='secondary' className='w-full'>
                <SelectValue placeholder='Select a module…' />
              </SelectTrigger>
              <SelectContent>
                {TARGET_MODULES_FROM_REGISTRY.map((m) => (
                  <SelectItem key={m.id} value={m.targetModule!}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='flex flex-col gap-1.5'>
            <label className='text-paragraph-sm text-neutral-1400 font-semibold'>
              Submodule <span className='text-neutral-800 font-normal'>(optional)</span>
            </label>
            <Select
              value={selectedSubmodule}
              onValueChange={setSelectedSubmodule}
              disabled={!selectedTarget || submodules.length === 0}
            >
              <SelectTrigger variant='secondary' className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={WHOLE_MODULE_SENTINEL}>Whole module</SelectItem>
                {submodules.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!selectedTarget} onClick={handleAttach}>
            Attach
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
