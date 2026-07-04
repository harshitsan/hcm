import { useEffect, useState } from 'react'
import { UploadSimple } from 'phosphor-react'
import type { Role } from '@/context/role-context'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LayerBanner } from '../components/layer-banner'
import { TARGET_MODULES, type TargetModule } from '../data/business-logic'
import type { ArtifactDraft } from '../hooks/use-business-logic'
import { Canvas } from './components/Canvas'
import { RightPanel } from './components/RightPanel'
import { RunDrawer } from './components/RunDrawer'
import { TopBar } from './components/TopBar'
import { useStore } from './state/store'
import './designer.css'

function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el) return false
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable
}

/**
 * Workflow Designer — the engine's canvas authoring surface (Layer 1),
 * ported from the standalone workflow-designer POC. Structured canvas with
 * nested control flow, insertion points, validation-gated activation, a mock
 * test runner, undo/redo and localStorage persistence. "Publish to catalog"
 * hands the document to the Business logic store as a governed `flow`
 * artifact — versioned, scoped and toggled like every other artifact.
 */
export function DesignerTab({
  role,
  onPublish,
}: {
  role: Role
  onPublish: (draft: ArtifactDraft) => void
}) {
  const doc = useStore((s) => s.doc)
  const [targetModule, setTargetModule] = useState<TargetModule>(() => {
    // Default the publish target to the trigger's source module.
    const m = String(useStore.getState().doc.trigger.config.module ?? '')
    return (TARGET_MODULES as readonly string[]).includes(m)
      ? (m as TargetModule)
      : 'Leave Management'
  })

  // Cmd/Ctrl+Z / +Y undo-redo while the designer is mounted (from App.tsx).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return
      const key = e.key.toLowerCase()
      if (key !== 'z' && key !== 'y') return
      if (isEditableTarget(e.target)) return // don't hijack text-field undo
      e.preventDefault()
      const { undo, redo } = useStore.getState()
      if (key === 'y' || (key === 'z' && e.shiftKey)) redo()
      else undo()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  /** Authoring roles only, mirroring the Business logic tab (WFE-44). */
  const canPublish = role === 'Company Admin' || role === 'Platform Admin'

  const publish = () => {
    const event = String(doc.trigger.config.event ?? 'module event')
    onPublish({
      name: doc.name,
      description: `Canvas-authored flow — triggers on "${event}", ${doc.body.length} top-level step(s).`,
      type: 'flow',
      targetModule,
      definition: { kind: 'flow', doc: structuredClone(doc) },
    })
  }

  return (
    <div className='w-full'>
      <LayerBanner active='author' />

      <div className='mb-3 flex flex-wrap items-center justify-between gap-3'>
        <p className='text-neutral-1000 text-sm'>
          Author process flows on the canvas, test them against a sample
          payload, then publish into the Business logic catalog as a governed
          artifact.
        </p>
        {canPublish && (
          <div className='flex items-center gap-2'>
            <Select
              value={targetModule}
              onValueChange={(v) => setTargetModule(v as TargetModule)}
            >
              <SelectTrigger variant='secondary' className='h-7 w-[200px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TARGET_MODULES.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant='red'
              onClick={publish}
              className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
            >
              <UploadSimple size={12} weight='bold' />
              Publish to catalog
            </Button>
          </div>
        )}
      </div>

      <div className='wfd overflow-hidden rounded-md border border-gray-200'>
        <div className='app'>
          <main className='main'>
            <TopBar />
            <Canvas />
            <RunDrawer />
          </main>
          <RightPanel />
        </div>
      </div>
    </div>
  )
}
