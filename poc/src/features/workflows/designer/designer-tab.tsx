import { useEffect, useState } from 'react'
import { UploadSimple } from 'phosphor-react'
import type { Role } from '@/context/role-context'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LayerBanner } from '../components/layer-banner'
import {
  TARGET_MODULES,
  type Artifact,
  type TargetModule,
} from '../data/business-logic'
import type { ArtifactDraft } from '../hooks/use-business-logic'
import { Canvas } from './components/Canvas'
import { RightPanel } from './components/RightPanel'
import { RunDrawer } from './components/RunDrawer'
import { TopBar } from './components/TopBar'
import { useDesignerStoreApi, useStore } from './state/store-context'
import './designer.css'

function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el) return false
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable
}

/**
 * Build tab — the engine's canvas authoring surface (Author layer). The
 * workflow picker switches between browser-saved workflows, starts a new one,
 * or loads any published catalog flow into the same canvas for preview and
 * editing. Publishing creates a `flow` artifact in the Configure catalog —
 * or, when the canvas holds a catalog-loaded flow, bumps that artifact to
 * its next version.
 */
export function DesignerTab({
  role,
  flows,
  onPublish,
  onUpdate,
}: {
  role: Role
  /** Published `flow` artifacts from the Configure catalog. */
  flows: Artifact[]
  onPublish: (draft: ArtifactDraft) => Artifact
  onUpdate: (id: string, draft: ArtifactDraft) => void
}) {
  const doc = useStore((s) => s.doc)
  const library = useStore((s) => s.library)
  const activeSource = useStore((s) => s.activeSource)
  const store = useDesignerStoreApi()
  const { newDoc, openDoc, loadExternal, linkArtifact } = store.getState()

  const [targetModule, setTargetModule] = useState<TargetModule>(() => {
    const m = String(store.getState().doc.trigger.config.module ?? '')
    return (TARGET_MODULES as readonly string[]).includes(m)
      ? (m as TargetModule)
      : 'Leave Management'
  })

  // Follow the active workflow: default the publish target to its trigger module.
  useEffect(() => {
    const m = String(store.getState().doc.trigger.config.module ?? '')
    if ((TARGET_MODULES as readonly string[]).includes(m)) {
      setTargetModule(m as TargetModule)
    }
  }, [doc.id, store])

  // Cmd/Ctrl+Z / +Y undo-redo while the designer is mounted.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return
      const key = e.key.toLowerCase()
      if (key !== 'z' && key !== 'y') return
      if (isEditableTarget(e.target)) return // don't hijack text-field undo
      e.preventDefault()
      const { undo, redo } = store.getState()
      if (key === 'y' || (key === 'z' && e.shiftKey)) redo()
      else undo()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [store])

  /** Authoring roles only, mirroring the Configure tab (WFE-44). */
  const canPublish = role === 'Company Admin' || role === 'Platform Admin'

  const onPickWorkflow = (value: string) => {
    if (value === '__new__') {
      newDoc()
      return
    }
    if (value.startsWith('flow:')) {
      const art = flows.find((a) => a.id === value.slice(5))
      if (art && art.definition.kind === 'flow') {
        loadExternal(art.definition.doc, {
          artifactId: art.id,
          artifactName: art.name,
          version: art.version,
        })
      }
      return
    }
    openDoc(value)
  }

  const publish = () => {
    const event = String(doc.trigger.config.event ?? 'module event')
    const draft: ArtifactDraft = {
      name: doc.name,
      description: `Canvas-authored flow — triggers on "${event}", ${doc.body.length} top-level step(s).`,
      type: 'flow',
      targetModule,
      definition: { kind: 'flow', doc: structuredClone(doc) },
    }
    if (activeSource) {
      onUpdate(activeSource.artifactId, draft)
      linkArtifact({
        artifactId: activeSource.artifactId,
        artifactName: doc.name,
        version: activeSource.version + 1,
      })
    } else {
      const artifact = onPublish(draft)
      linkArtifact({
        artifactId: artifact.id,
        artifactName: artifact.name,
        version: artifact.version,
      })
    }
  }

  return (
    <div className='w-full'>
      <LayerBanner active='author' />

      <div className='mb-2 flex flex-wrap items-center justify-between gap-3'>
        <p className='text-neutral-1000 text-sm'>
          Author flows on the canvas — switch workflows, start a new one, or
          preview any published flow, then publish into the Configure catalog.
        </p>
        <div className='flex flex-wrap items-center gap-2'>
          <Select value={doc.id} onValueChange={onPickWorkflow}>
            <SelectTrigger variant='secondary' className='h-7 w-[230px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Workflows in this browser</SelectLabel>
                <SelectItem value={doc.id}>
                  {doc.name || 'Untitled workflow'}
                </SelectItem>
                {library.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name || 'Untitled workflow'}
                  </SelectItem>
                ))}
              </SelectGroup>
              {flows.length > 0 && (
                <SelectGroup>
                  <SelectLabel>Published flows (catalog preview)</SelectLabel>
                  {flows.map((a) => (
                    <SelectItem key={a.id} value={`flow:${a.id}`}>
                      {a.name} · v{a.version}
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}
              <SelectSeparator />
              <SelectItem value='__new__'>+ New workflow</SelectItem>
            </SelectContent>
          </Select>
          {canPublish && (
            <>
              <Select
                value={targetModule}
                onValueChange={(v) => setTargetModule(v as TargetModule)}
              >
                <SelectTrigger variant='secondary' className='h-7 w-[190px]'>
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
                {activeSource
                  ? `Publish v${activeSource.version + 1}`
                  : 'Publish to catalog'}
              </Button>
            </>
          )}
        </div>
      </div>

      {activeSource && (
        <p className='text-neutral-1000 mb-2 text-xs'>
          Loaded from catalog:{' '}
          <span className='font-medium'>{activeSource.artifactName}</span> v
          {activeSource.version} — publishing updates the same artifact to v
          {activeSource.version + 1}.
        </p>
      )}

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
