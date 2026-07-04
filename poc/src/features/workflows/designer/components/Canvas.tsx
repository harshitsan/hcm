import { useRef, useState } from 'react'
import { useStore } from '../state/store'
import { Sequence } from './Sequence'

export function Canvas() {
  const body = useStore(s => s.doc.body)
  const select = useStore(s => s.select)
  const closeInsert = useStore(s => s.closeInsert)
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 })
  const drag = useRef<{ x: number; y: number } | null>(null)

  const isBackground = (target: EventTarget, currentTarget: EventTarget) =>
    target === currentTarget || (target as HTMLElement).classList?.contains('canvas-inner')

  return (
    <div
      className="canvas"
      onWheel={e => {
        const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08
        setView(v => ({ ...v, scale: Math.min(2, Math.max(0.3, v.scale * factor)) }))
      }}
      onPointerDown={e => {
        if (!isBackground(e.target, e.currentTarget)) return
        drag.current = { x: e.clientX - view.x, y: e.clientY - view.y }
        e.currentTarget.setPointerCapture(e.pointerId)
      }}
      onPointerMove={e => {
        if (!drag.current) return
        setView(v => ({ ...v, x: e.clientX - drag.current!.x, y: e.clientY - drag.current!.y }))
      }}
      onPointerUp={() => { drag.current = null }}
      onClick={e => {
        if (isBackground(e.target, e.currentTarget)) { select(null); closeInsert() }
      }}
    >
      <div className="canvas-inner" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}>
        <Sequence branchId="root" steps={body} />
      </div>
    </div>
  )
}
