import { useSyncExternalStore } from 'react'
import { setAllCollapsed, validate } from '../core/ops'
import type { InsertTarget, ValidationIssue } from '../core/ops'
import { isContainer, makeId } from '../core/model'
import type { Step, WorkflowDoc } from '../core/model'
import { isKnownKind } from '../core/registry'
import { runWorkflow } from '../core/runner'
import type { RunEvent } from '../core/runner'
import { blankDoc, seedDoc } from '../core/seed'

// v3: multi-workflow library + catalog links (HRMS vocabulary since v2)
const STORAGE_KEY = 'satellitehr-poc:workflow-designer:v3'

export type Selection = { type: 'step' | 'branch' | 'trigger'; id: string } | null
export type RunState = {
  active: boolean
  statuses: Record<string, 'running' | 'success' | 'error'>
  log: string[]
  outputs: Record<string, unknown>
}

/** Link between a canvas doc and the catalog artifact it was loaded from. */
export type DocSource = {
  artifactId: string
  artifactName: string
  version: number
}

type State = {
  doc: WorkflowDoc
  /** Other workflows saved in this browser (the active one lives in `doc`). */
  library: WorkflowDoc[]
  /** Catalog provenance per doc id — drives update-vs-create on publish. */
  sources: Record<string, DocSource>
  activeSource: DocSource | null
  selection: Selection
  insertTarget: InsertTarget | null
  extended: boolean
  past: WorkflowDoc[]
  future: WorkflowDoc[]
  canUndo: boolean
  canRedo: boolean
  run: RunState | null
  issues: ValidationIssue[]
  apply: (fn: (d: WorkflowDoc) => WorkflowDoc) => void
  undo: () => void
  redo: () => void
  select: (sel: Selection) => void
  openInsert: (target: InsertTarget) => void
  closeInsert: () => void
  setExtended: (on: boolean) => void
  setName: (name: string) => void
  tryActivate: () => boolean
  deactivate: () => void
  /** Stash the current doc in the library and start a blank workflow. */
  newDoc: () => void
  /** Switch to another workflow saved in the library. */
  openDoc: (id: string) => void
  /** Load a catalog flow into the canvas as a linked working copy. */
  loadExternal: (doc: WorkflowDoc, source: DocSource) => void
  /** Record that the active doc is published as this catalog artifact. */
  linkArtifact: (source: DocSource) => void
  /** Starts a test run; optional JSON overrides the trigger's sample payload.
      Returns an error message if the JSON is invalid (run not started). */
  startTestRun: (payloadJson?: string) => string | null
  stopTestRun: () => void
  closeRun: () => void
  exportJson: () => string
  importJson: (text: string) => string | null
}

function allKindsKnown(steps: Step[]): boolean {
  return steps.every(
    (s) =>
      isKnownKind(s.kind) &&
      (!isContainer(s) || s.branches.every((b) => allKindsKnown(b.steps)))
  )
}

function isValidDocShape(parsed: unknown): parsed is WorkflowDoc {
  const p = parsed as WorkflowDoc
  return !!p && typeof p === 'object' && typeof p.id === 'string'
    && typeof p.name === 'string' && !!p.trigger && Array.isArray(p.body)
    // Docs persisted with a retired node vocabulary fall back to the seed.
    && p.trigger.kind === 'moduleEvent' && allKindsKnown(p.body)
}

type Persisted = {
  doc: WorkflowDoc
  library: WorkflowDoc[]
  sources: Record<string, DocSource>
}

function loadPersisted(): Persisted {
  const fallback = (): Persisted => ({ doc: seedDoc(), library: [], sources: {} })
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback()
    const parsed = JSON.parse(raw) as Partial<Persisted> | null
    if (!parsed || !isValidDocShape(parsed.doc)) return fallback()
    return {
      doc: parsed.doc,
      library: Array.isArray(parsed.library)
        ? parsed.library.filter(isValidDocShape)
        : [],
      sources:
        parsed.sources && typeof parsed.sources === 'object'
          ? parsed.sources
          : {},
    }
  } catch {
    return fallback()
  }
}

const persisted = loadPersisted()

let runController: AbortController | null = null

/**
 * Minimal external store replacing Zustand (the hcm POC adds no new
 * dependencies). Exposes the exact same API surface the designer components
 * were written against: `useStore(selector)`, `useStore.getState()`,
 * `useStore.subscribe(listener)`.
 */
const listeners = new Set<() => void>()
let state: State

function set(partial: Partial<State> | State | ((s: State) => Partial<State> | State)): void {
  const next = typeof partial === 'function' ? partial(state) : partial
  if (next === state) return
  state = { ...state, ...next }
  for (const l of listeners) l()
}

function getState(): State {
  return state
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

function get(): State {
  return state
}

state = {
  doc: persisted.doc,
  library: persisted.library,
  sources: persisted.sources,
  activeSource: persisted.sources[persisted.doc.id] ?? null,
  selection: null,
  insertTarget: null,
  extended: true,
  past: [],
  future: [],
  canUndo: false,
  canRedo: false,
  run: null,
  issues: [],

  apply: fn => {
    const { doc, past } = get()
    let next = fn(doc)
    if (next === doc) return
    if (next.status === 'active') next = { ...next, status: 'draft' }
    set({
      doc: next,
      past: [...past.slice(-49), doc],
      future: [],
      canUndo: true,
      canRedo: false,
      issues: [],
    })
  },

  undo: () => {
    const { past, future, doc } = get()
    if (past.length === 0) return
    const prev = past[past.length - 1]
    set({
      doc: prev,
      past: past.slice(0, -1),
      future: [doc, ...future],
      canUndo: past.length > 1,
      canRedo: true,
    })
  },

  redo: () => {
    const { past, future, doc } = get()
    if (future.length === 0) return
    const [next, ...rest] = future
    set({
      doc: next,
      past: [...past, doc],
      future: rest,
      canUndo: true,
      canRedo: rest.length > 0,
    })
  },

  select: sel => set({ selection: sel, insertTarget: null }),
  openInsert: target => set({ insertTarget: target, selection: null }),
  closeInsert: () => set({ insertTarget: null }),

  setExtended: on => {
    set({ extended: on })
    get().apply(d => setAllCollapsed(d, !on))
  },

  setName: name => {
    const { doc, past } = get()
    set({ doc: { ...doc, name }, past: [...past.slice(-49), doc], future: [], canUndo: true, canRedo: false })
  },

  tryActivate: () => {
    const { doc } = get()
    const issues = validate(doc)
    if (issues.length > 0) { set({ issues }); return false }
    set({ doc: { ...doc, status: 'active' }, issues: [] })
    return true
  },

  deactivate: () => set(s => ({ doc: { ...s.doc, status: 'draft' } })),

  newDoc: () => {
    runController?.abort()
    const { doc, library } = get()
    set({
      doc: blankDoc(),
      library: [doc, ...library.filter(d => d.id !== doc.id)],
      activeSource: null,
      past: [], future: [], canUndo: false, canRedo: false,
      selection: null, insertTarget: null, run: null, issues: [],
    })
  },

  openDoc: (id: string) => {
    const { doc, library, sources } = get()
    if (id === doc.id) return
    const next = library.find(d => d.id === id)
    if (!next) return
    runController?.abort()
    set({
      doc: structuredClone(next),
      library: [doc, ...library.filter(d => d.id !== id && d.id !== doc.id)],
      activeSource: sources[id] ?? null,
      past: [], future: [], canUndo: false, canRedo: false,
      selection: null, insertTarget: null, run: null, issues: [],
    })
  },

  loadExternal: (extDoc, source) => {
    runController?.abort()
    const { doc, library, sources } = get()
    const clone = structuredClone(extDoc)
    clone.id = makeId('wf')
    clone.status = 'draft'
    set({
      doc: clone,
      library: [doc, ...library.filter(d => d.id !== doc.id)],
      sources: { ...sources, [clone.id]: source },
      activeSource: source,
      past: [], future: [], canUndo: false, canRedo: false,
      selection: null, insertTarget: null, run: null, issues: [],
    })
  },

  linkArtifact: source => {
    const { doc, sources } = get()
    set({ sources: { ...sources, [doc.id]: source }, activeSource: source })
  },

  startTestRun: (payloadJson?: string) => {
    let payloadOverride: unknown
    if (payloadJson !== undefined) {
      try { payloadOverride = JSON.parse(payloadJson) } catch { return 'Payload is not valid JSON' }
    }
    runController?.abort()
    runController = new AbortController()
    set({ run: { active: true, statuses: {}, log: [], outputs: {} } })
    const emit = (e: RunEvent) => {
      set(s => {
        if (!s.run) return s
        const statuses = { ...s.run.statuses }
        const log = [...s.run.log]
        const outputs = { ...s.run.outputs }
        if (e.type === 'enter') statuses[e.id] = 'running'
        if (e.type === 'success') { statuses[e.id] = 'success'; outputs[e.id] = e.data }
        if (e.type === 'error') statuses[e.id] = 'error'
        if (e.message) log.push(e.message)
        return { run: { ...s.run, statuses, log, outputs } }
      })
    }
    runWorkflow(get().doc, emit, runController.signal, 400, payloadOverride)
      .catch(() => {})
      .finally(() => set(s => (s.run ? { run: { ...s.run, active: false } } : s)))
    return null
  },

  stopTestRun: () => {
    runController?.abort()
    set(s => (s.run ? { run: { ...s.run, active: false } } : s))
  },

  closeRun: () => {
    runController?.abort()
    set({ run: null })
  },

  exportJson: () => JSON.stringify(get().doc, null, 2),

  importJson: text => {
    try {
      const parsed: unknown = JSON.parse(text)
      if (!isValidDocShape(parsed)) return 'Invalid workflow file'
      get().apply(() => parsed)
      return null
    } catch {
      return 'Invalid JSON'
    }
  },
}

function useStoreImpl<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state))
}

export const useStore = Object.assign(useStoreImpl, { getState, subscribe })

// Debounced autosave — active doc + library + catalog links
let saveTimer: ReturnType<typeof setTimeout> | undefined
subscribe(() => {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    try {
      const { doc, library, sources } = state
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ doc, library, sources }))
    } catch { /* quota exceeded: skip save */ }
  }, 500)
})
