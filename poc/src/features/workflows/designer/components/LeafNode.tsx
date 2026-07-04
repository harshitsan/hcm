import type { LeafStep } from '../core/model'
import { getDef } from '../core/registry'
import { useStore } from '../state/store'
import { StepMenu } from './StepMenu'

export function LeafNode({ step, index }: { step: LeafStep; index: number }) {
  const def = getDef(step.kind)
  const selected = useStore(s => s.selection?.id === step.id)
  const runStatus = useStore(s => s.run?.statuses[step.id])
  const select = useStore(s => s.select)
  const Icon = def.icon
  return (
    <div
      className={`node leaf accent-${def.accent} ${selected ? 'selected' : ''} ${runStatus ?? ''}`}
      onClick={e => { e.stopPropagation(); select({ type: 'step', id: step.id }) }}
    >
      <div className="node-head">
        <span className={`kind-chip accent-${def.accent}`}><Icon size={12} /> {def.label}</span>
        <StepMenu step={step} />
      </div>
      <div className="node-body">
        <strong>{index + 1}. {step.label}</strong>
      </div>
    </div>
  )
}
