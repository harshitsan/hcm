/**
 * workflow-editor-sheet.tsx — Task 4: Wide canvas editor for any catalog artifact
 *
 * A right-sliding Sheet that hosts the full Designer canvas for editing ANY
 * artifact type. Lifecycle: store created on (open && artifactId), destroyed on
 * close. paletteKinds constrained per type. Dirty-confirm on close. Save gates
 * on hasRole, calls docFromCanvas → updateArtifact.
 */

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { GitBranch } from 'lucide-react'
import { toast } from 'sonner'
import { useRole } from '@/context/role-context'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Canvas } from '../designer/components/Canvas'
import { RightPanel } from '../designer/components/RightPanel'
import { RunDrawer } from '../designer/components/RunDrawer'
import { TopBar } from '../designer/components/TopBar'
import { artifactToDoc, docFromCanvas } from '../data/artifact-doc'
import {
  ARTIFACT_TYPE_LABELS,
  type Artifact,
  type ArtifactType,
} from '../data/business-logic'
import type { StepKind } from '../designer/core/model'
import { createDesignerStore } from '../designer/state/store'
import type { DesignerStore } from '../designer/state/store'
import { DesignerStoreProvider, useStore } from '../designer/state/store-context'
import { subscribe, getSnapshot, useBusinessLogic } from '../hooks/use-business-logic'
import '../designer/designer.css'

// ─── paletteFor ───────────────────────────────────────────────────────────────

const PAYLOAD_KINDS = new Set<ArtifactType>([
  'custom-form',
  'checklist',
  'template',
  'alert',
  'setting',
  'category-list',
  'calendar',
])

function paletteFor(type: ArtifactType): StepKind[] | null {
  if (type === 'approver-chain') return ['approvalTask']
  if (type === 'decision-rule') return ['ruleCondition', 'ruleOutcome']
  if (PAYLOAD_KINDS.has(type)) return []
  // flow → full palette
  return null
}

function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el) return false
  return (
    el.tagName === 'INPUT' ||
    el.tagName === 'TEXTAREA' ||
    el.tagName === 'SELECT' ||
    el.isContentEditable
  )
}

// ─── Kind chip ────────────────────────────────────────────────────────────────

function KindChip({ type }: { type: ArtifactType }) {
  const label = ARTIFACT_TYPE_LABELS[type]
  return (
    <span className='wfd'>
      <span className='kind-chip accent-purple'>{label}</span>
    </span>
  )
}

// ─── SheetInner — must be inside DesignerStoreProvider ────────────────────────

/**
 * Rendered inside DesignerStoreProvider so it can read from the per-session
 * designer store. The canRequestClose ref is how ESC/overlay events (from the
 * outer SheetContent) coordinate with the dirty guard here.
 */
function SheetInner({
  artifact,
  onRequestClose,
  closeRequestRef,
}: {
  artifact: Artifact
  onRequestClose: () => void
  /**
   * Callback registered by SheetInner so that the outer SheetContent's
   * onEscapeKeyDown / onInteractOutside can trigger a guarded close attempt.
   */
  closeRequestRef: React.MutableRefObject<(() => void) | null>
}) {
  const { hasRole } = useRole()
  const { updateArtifact } = useBusinessLogic({ actor: 'WorkflowEditor' })
  const dirty = useStore((s) => s.canUndo)
  const doc = useStore((s) => s.doc)

  const canSave = hasRole('Company Admin', 'Platform Admin')
  const mode: 'flow' | 'payload' = artifact.type === 'flow' ? 'flow' : 'payload'

  // Expose guarded close to parent (for ESC / overlay events)
  const dirtyRef = useRef(dirty)
  dirtyRef.current = dirty

  useEffect(() => {
    closeRequestRef.current = () => {
      if (dirtyRef.current) {
        if (!window.confirm('Discard unsaved workflow changes?')) return
      }
      onRequestClose()
    }
    return () => {
      closeRequestRef.current = null
    }
  }, [closeRequestRef, onRequestClose])

  const handleSave = () => {
    const res = docFromCanvas(doc, artifact.type)
    if (!res.ok) {
      toast.error(res.error)
      return
    }
    // Construct draft WITHOUT attachments key — avoids clobbering attachments
    // because updateArtifact does {...a, ...draft} (use-business-logic.ts:107)
    updateArtifact(artifact.id, {
      name: doc.name,
      description: artifact.description,
      type: artifact.type,
      targetModule: artifact.targetModule,
      definition: res.definition,
    })
    // Close without dirty confirm — save succeeded
    onRequestClose()
  }

  return (
    <>
      {/* Header row h-14 with border-b; pe-12 keeps Save clear of the sheet's built-in X */}
      <div className='flex h-14 shrink-0 items-center gap-3 border-b ps-4 pe-12'>
        <GitBranch size={18} className='text-neutral-1000 shrink-0' />
        <span className='text-neutral-1600 truncate font-semibold text-sm'>
          {artifact.name}
        </span>
        <KindChip type={artifact.type} />
        <span className='text-neutral-700 text-xs shrink-0'>v{artifact.version}</span>
        <div className='flex-1' />
        {canSave && (
          <Button
            variant='red'
            onClick={handleSave}
            className='bg-orange-1200 hover:bg-orange-1200 h-7 shrink-0 gap-1! rounded-[6px]! px-2!'
          >
            Save v{artifact.version + 1}
          </Button>
        )}
      </div>

      {/* Designer canvas body — app-sheet grid overrides the embed override */}
      <div className='wfd h-[calc(100dvh-56px)] overflow-hidden'>
        <div className='app app-sheet'>
          <main className='main'>
            <TopBar mode={mode} />
            <Canvas />
            <RunDrawer />
          </main>
          <RightPanel />
        </div>
      </div>
    </>
  )
}

// ─── SheetBodyWithStore — creates / destroys the per-session DesignerStore ────

function SheetBodyWithStore({
  artifact,
  onRequestClose,
  closeRequestRef,
}: {
  artifact: Artifact
  onRequestClose: () => void
  closeRequestRef: React.MutableRefObject<(() => void) | null>
}) {
  const [store, setStore] = useState<DesignerStore | null>(null)
  const storeRef = useRef<DesignerStore | null>(null)

  // Create store when artifact identity changes; destroy on unmount
  useEffect(() => {
    const s = createDesignerStore({
      initialDoc: artifactToDoc(artifact),
      persistKey: null,           // NO localStorage — isolated ephemeral session
      paletteKinds: paletteFor(artifact.type),
    })
    storeRef.current = s
    setStore(s)
    return () => {
      s.destroy()
      storeRef.current = null
      setStore(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artifact.id, artifact.version])

  // Bind Cmd/Ctrl+Z / +Y undo-redo scoped to this sheet's store while open.
  // Uses capture phase (true) so this listener runs before any bubble-phase
  // listener (including designer-tab's). stopPropagation prevents the event
  // from reaching bubble-phase listeners so the designer-tab store is not
  // also triggered on the same keypress.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return
      const key = e.key.toLowerCase()
      if (key !== 'z' && key !== 'y') return
      if (isEditableTarget(e.target)) return
      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation()
      const s = storeRef.current
      if (!s) return
      const { undo, redo } = s.getState()
      if (key === 'y' || (key === 'z' && e.shiftKey)) redo()
      else undo()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])

  if (!store) return null

  return (
    <DesignerStoreProvider store={store}>
      <SheetInner
        artifact={artifact}
        onRequestClose={onRequestClose}
        closeRequestRef={closeRequestRef}
      />
    </DesignerStoreProvider>
  )
}

// ─── WorkflowEditorSheet (public) ─────────────────────────────────────────────

export function WorkflowEditorSheet({
  artifactId,
  open,
  onOpenChange,
}: {
  artifactId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  // Stay fresh across version bumps via the external artifact store
  const artifacts = useSyncExternalStore(subscribe, getSnapshot)
  const artifact = artifactId
    ? (artifacts.find((a) => a.id === artifactId) ?? null)
    : null

  /**
   * closeRequestRef is the bridge between the SheetContent's keyboard/pointer
   * interceptors (outer scope) and SheetInner's dirty guard (inner store scope).
   * SheetInner registers a guarded-close function here on mount.
   */
  const closeRequestRef = useRef<(() => void) | null>(null)

  return (
    <Sheet open={open} onOpenChange={(next) => {
      if (!next) {
        // onOpenChange(false) fires from the built-in X button (SheetPrimitive.Close).
        // ESC and overlay clicks are intercepted below; only the X button reaches here.
        // Apply the same dirty guard via closeRequestRef.
        if (closeRequestRef.current) {
          closeRequestRef.current()
        } else {
          onOpenChange(false)
        }
      }
    }}>
      <SheetContent
        side='right'
        className='w-[min(1200px,94vw)] sm:max-w-none gap-0 p-0'
        onEscapeKeyDown={(e) => {
          // Prevent Radix from closing immediately; delegate to the guarded handler
          e.preventDefault()
          closeRequestRef.current?.()
        }}
        onInteractOutside={(e) => {
          // Prevent Radix from closing immediately; delegate to the guarded handler
          e.preventDefault()
          closeRequestRef.current?.()
        }}
      >
        {open && artifact && (
          <SheetBodyWithStore
            artifact={artifact}
            onRequestClose={() => onOpenChange(false)}
            closeRequestRef={closeRequestRef}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}
