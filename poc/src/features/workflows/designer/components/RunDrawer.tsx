import { Loader2, X } from 'lucide-react'
import { useStore } from '../state/store-context'

export function RunDrawer() {
  const run = useStore(s => s.run)
  const closeRun = useStore(s => s.closeRun)
  if (!run) return null
  return (
    <div className="run-drawer">
      <div className="run-head">
        <span className="run-title">
          {run.active ? <Loader2 size={13} className="spin" /> : null}
          Test run {run.active ? 'running…' : 'finished'}
        </span>
        <button className="icon-btn" aria-label="Close run" onClick={closeRun}><X size={14} /></button>
      </div>
      <div className="run-log">
        {run.log.map((line, i) => <div key={i} className="run-line">{line}</div>)}
      </div>
    </div>
  )
}
