import { Plus } from 'lucide-react'
import type { Step } from '../core/model'
import { isContainer } from '../core/model'
import { useStore } from '../state/store'
import { ContainerNode } from './ContainerNode'
import { LeafNode } from './LeafNode'
import { TriggerNode } from './TriggerNode'

function InsertPoint({ branchId, index }: { branchId: string | 'root'; index: number }) {
  const openInsert = useStore(s => s.openInsert)
  const targeted = useStore(s => s.insertTarget?.branchId === branchId && s.insertTarget?.index === index)
  return (
    <div className="edge-v">
      <button
        aria-label="Add step"
        className={`insert ${targeted ? 'targeted' : ''}`}
        onClick={e => { e.stopPropagation(); openInsert({ branchId, index }) }}
      >
        <Plus size={12} />
      </button>
    </div>
  )
}

export function Sequence({ branchId, steps }: { branchId: string | 'root'; steps: Step[] }) {
  const isRoot = branchId === 'root'
  return (
    <div className="sequence">
      {isRoot && <TriggerNode />}
      {steps.map((step, i) => (
        <div className="seq-item" key={step.id}>
          <InsertPoint branchId={branchId} index={i} />
          {isContainer(step)
            ? <ContainerNode step={step} />
            : <LeafNode step={step} index={i} />}
        </div>
      ))}
      <InsertPoint branchId={branchId} index={steps.length} />
      {isRoot && <div className="end-chip">End</div>}
    </div>
  )
}
