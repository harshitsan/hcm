import { Zap } from 'lucide-react'
import { useStore } from '../state/store'

export function TriggerNode() {
  const trigger = useStore(s => s.doc.trigger)
  const selected = useStore(s => s.selection?.id === trigger.id)
  const runStatus = useStore(s => s.run?.statuses[trigger.id])
  const select = useStore(s => s.select)
  return (
    <div
      className={`node leaf accent-green ${selected ? 'selected' : ''} ${runStatus ?? ''}`}
      onClick={e => { e.stopPropagation(); select({ type: 'trigger', id: trigger.id }) }}
    >
      <div className="node-head">
        <span className="kind-chip accent-green"><Zap size={12} /> Scheduler</span>
      </div>
      <div className="node-body">
        <strong>1. Scheduler</strong>
        <div className="hint">Triggers start your workflow</div>
      </div>
    </div>
  )
}
