import { useRef, useState } from 'react'
import { ChevronDown, Download, FlaskConical, Package, Redo2, Undo2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { useStore, useDesignerStoreApi } from '../state/store-context'
import { serializeBundle } from '../../data/artifact-io'
import { normalizeArtifact } from '../../data/business-logic'
import type { Artifact, TargetModule } from '../../data/business-logic'

function TestPayloadDialog({ onClose }: { onClose: () => void }) {
  const sample = useStore(s => String(s.doc.trigger.config.samplePayload ?? ''))
  const startTestRun = useStore(s => s.startTestRun)
  const [text, setText] = useState(sample)
  const [error, setError] = useState<string | null>(null)
  const run = () => {
    const err = startTestRun(text)
    if (err) { setError(err); return }
    onClose()
  }
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>Test with custom payload</h3>
        <p className="data-note">This JSON becomes <code>payload</code> for this run only — the trigger's sample is untouched.</p>
        <textarea
          aria-label="Test payload JSON" rows={12} value={text} spellCheck={false}
          onChange={e => { setText(e.target.value); setError(null) }}
        />
        {error && <div className="modal-error">{error}</div>}
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={run}><FlaskConical size={13} /> Run test</button>
        </div>
      </div>
    </div>
  )
}

function Toggle({ label, checked, onChange }: {
  label: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <label className="switch">
      <input type="checkbox" aria-label={label} checked={checked}
        onChange={e => onChange(e.target.checked)} />
      <span className="switch-track" />
      <span className="switch-label">{label}</span>
    </label>
  )
}

export function TopBar({ mode = 'flow' }: { mode?: 'flow' | 'payload' }) {
  const doc = useStore(s => s.doc)
  const extended = useStore(s => s.extended)
  const issues = useStore(s => s.issues)
  const canUndo = useStore(s => s.canUndo)
  const canRedo = useStore(s => s.canRedo)
  const runActive = useStore(s => s.run?.active ?? false)
  const store = useDesignerStoreApi()
  const {
    setName, setExtended, tryActivate, deactivate, undo, redo,
    startTestRun, stopTestRun, exportJson, importJson, select,
  } = store.getState()
  const fileRef = useRef<HTMLInputElement>(null)
  const [payloadDialog, setPayloadDialog] = useState(false)

  const onExport = () => {
    const blob = new Blob([exportJson()], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${doc.name.replace(/\s+/g, '-').toLowerCase()}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const onImport = async (file: File | undefined) => {
    if (!file) return
    const err = importJson(await file.text())
    if (err) alert(err)
  }

  /** Export as artifact bundle — wraps the current doc as a single `flow` artifact. */
  const onExportBundle = () => {
    const targetModule = (doc.trigger.config.module as TargetModule | undefined) ?? 'Platform Admin'
    const artifact: Artifact = normalizeArtifact({
      id: `bl-${crypto.randomUUID().slice(0, 6)}`,
      name: doc.name,
      type: 'flow',
      targetModule,
      description: `Flow exported from the Designer: ${doc.name}`,
      version: 1,
      scopes: { platform: false, portfolio: false, group: false, company: true },
      definition: { kind: 'flow', doc },
      updatedBy: 'Designer',
      updatedAt: new Date().toISOString().slice(0, 10),
      history: [
        { at: new Date().toISOString().slice(0, 16).replace('T', ' '), actor: 'Designer', event: 'Exported from Designer — v1' },
      ],
    })
    const blob = new Blob([serializeBundle([artifact])], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `workflow-${doc.name.replace(/\s+/g, '-').toLowerCase()}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    toast.success(`"${doc.name}" exported as workflow bundle — import it from the Configure tab`)
  }

  return (
    <>
      <header className="topbar">
        <div className="topbar-left">
          <input className="wf-name" value={doc.name} onChange={e => setName(e.target.value)} />
          <span className={`status-chip ${doc.status}`}>{doc.status === 'active' ? 'Active' : 'Draft'}</span>
        </div>
        <div className="topbar-right">
          <Toggle label="Extended" checked={extended} onChange={setExtended} />
          {mode === 'flow' && (
            <Toggle label="Activate" checked={doc.status === 'active'}
              onChange={on => { if (on) { tryActivate() } else { deactivate() } }} />
          )}
          {mode === 'flow' && (
            <div className="test-split">
              <button className="btn split-main" onClick={() => (runActive ? stopTestRun() : startTestRun())}>
                <FlaskConical size={13} /> {runActive ? 'Stop' : 'Test'}
              </button>
              <button className="btn split-arrow" aria-label="Test options"
                onClick={() => setPayloadDialog(true)}><ChevronDown size={13} /></button>
            </div>
          )}
          <button className="icon-btn" aria-label="Undo" disabled={!canUndo} onClick={undo}><Undo2 size={15} /></button>
          <button className="icon-btn" aria-label="Redo" disabled={!canRedo} onClick={redo}><Redo2 size={15} /></button>
          <button className="icon-btn" aria-label="Export" onClick={onExport}><Download size={15} /></button>
          {mode === 'flow' && (
            <button className="icon-btn" aria-label="Export as workflow bundle" title="Export as workflow bundle" onClick={onExportBundle}><Package size={15} /></button>
          )}
          {mode === 'flow' && (
            <>
              <button className="icon-btn" aria-label="Import" onClick={() => fileRef.current?.click()}><Upload size={15} /></button>
              <input ref={fileRef} type="file" accept=".json" hidden
                onChange={e => { void onImport(e.target.files?.[0]) }} />
            </>
          )}
        </div>
      </header>
      {issues.length > 0 && (
        <div className="issues">
          <strong>Cannot activate — fix these first:</strong>
          {issues.map((it, i) => (
            <button key={i} onClick={() => select({ type: 'step', id: it.nodeId })}>{it.message}</button>
          ))}
        </div>
      )}
      {payloadDialog && <TestPayloadDialog onClose={() => setPayloadDialog(false)} />}
    </>
  )
}
