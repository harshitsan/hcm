import { Zap } from 'lucide-react'
import { useStore } from '../state/store-context'

export function TriggerNode() {
  const trigger = useStore(s => s.doc.trigger)
  const selected = useStore(s => s.selection?.id === trigger.id)
  const runStatus = useStore(s => s.run?.statuses[trigger.id])
  const select = useStore(s => s.select)
  const module = String(trigger.config.module ?? 'Module event')
  const event = String(trigger.config.event ?? trigger.label)
  return (
    <div
      className={`node leaf accent-green ${selected ? 'selected' : ''} ${runStatus ?? ''}`}
      onClick={e => { e.stopPropagation(); select({ type: 'trigger', id: trigger.id }) }}
    >
      <div className="node-head">
        <span className="kind-chip accent-green"><Zap size={12} /> {module}</span>
      </div>
      <div className="node-body">
        <strong>1. {event}</strong>
        <div className="hint">Module events start this flow</div>
      </div>
    </div>
  )
}
