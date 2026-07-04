import { useSyncExternalStore } from 'react'
import { setAllCollapsed, validate } from '../core/ops'
import type { InsertTarget, ValidationIssue } from '../core/ops'
import type { WorkflowDoc } from '../core/model'
import { runWorkflow } from '../core/runner'
import type { RunEvent } from '../core/runner'
import { seedDoc } from '../core/seed'

const STORAGE_KEY = 'satellitehr-poc:workflow-designer'

export type Selection = { type: 'step' | 'branch' | 'trigger'; id: string } | null
export type RunState = {
  active: boolean
  statuses: Record<string, 'running' | 'success' | 'error'>
  log: string[]
  outputs: Record<string, unknown>
}

type State = {
  doc: WorkflowDoc
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
  /** Starts a test run; optional JSON overrides the trigger's sample payload.
      Returns an error message if the JSON is invalid (run not started). */
  startTestRun: (payloadJson?: string) => string | null
  stopTestRun: () => void
  closeRun: () => void
  exportJson: () => string
  importJson: (text: string) => string | null
}

function isValidDocShape(parsed: unknown): parsed is WorkflowDoc {
  const p = parsed as WorkflowDoc
  return !!p && typeof p === 'object' && typeof p.id === 'string'
    && typeof p.name === 'string' && !!p.trigger && Array.isArray(p.body)
}

function loadDoc(): WorkflowDoc {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seedDoc()
    const parsed: unknown = JSON.parse(raw)
    return isValidDocShape(parsed) ? parsed : seedDoc()
  } catch {
    return seedDoc()
  }
}

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
  doc: loadDoc(),
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

// Debounced autosave
let saveTimer: ReturnType<typeof setTimeout> | undefined
subscribe(() => {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.doc)) } catch { /* quota exceeded: skip save */ }
  }, 500)
})
