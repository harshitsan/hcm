import { useState } from 'react'
import { MoreVertical } from 'lucide-react'
import type { Step } from '../core/model'
import { isContainer } from '../core/model'
import { addBranch, duplicateStep, moveStep, removeStep } from '../core/ops'
import { getDef } from '../core/registry'
import { useStore } from '../state/store'

export function StepMenu({ step }: { step: Step }) {
  const [open, setOpen] = useState(false)
  const apply = useStore(s => s.apply)
  const act = (fn: () => void) => (e: React.MouseEvent) => { e.stopPropagation(); fn(); setOpen(false) }
  const addable = isContainer(step) ? getDef(step.kind).branchSpec?.addable : undefined
  return (
    <span className="step-menu">
      <button aria-label="Step menu" className="icon-btn" onClick={e => { e.stopPropagation(); setOpen(o => !o) }}>
        <MoreVertical size={14} />
      </button>
      {open && (
        <div className="menu-pop" onMouseLeave={() => setOpen(false)}>
          <button onClick={act(() => apply(d => duplicateStep(d, step.id)))}>Duplicate</button>
          <button onClick={act(() => apply(d => moveStep(d, step.id, 'up')))}>Move up</button>
          <button onClick={act(() => apply(d => moveStep(d, step.id, 'down')))}>Move down</button>
          {addable && (
            <button onClick={act(() => apply(d => addBranch(d, step.id)))}>
              Add {addable.def.label}
            </button>
          )}
          <button className="danger" onClick={act(() => apply(d => removeStep(d, step.id)))}>Delete</button>
        </div>
      )}
    </span>
  )
}
