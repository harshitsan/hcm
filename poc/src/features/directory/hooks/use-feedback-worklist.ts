import { useSyncExternalStore } from 'react'
import {
  NEXT_WORKLIST_STATUS,
  seedWorklistEntries,
  type FeedbackWorklistEntry,
  type WorklistCategory,
} from '../data/feedback-worklist'
import { SELF_EMPLOYEE_ID } from '../data/timeline'

/**
 * Module-level Feedback / Grievance queue. The employee self-service
 * "My Feedback" tab and the admin worklist read the same live store via
 * `useSyncExternalStore`, so a submission appears in the admin triage queue
 * immediately and a triage step is visible on the employee's status list.
 */
let entries: FeedbackWorklistEntry[] = seedWorklistEntries

const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot(): FeedbackWorklistEntry[] {
  return entries
}

function emit() {
  listeners.forEach((l) => l())
}

export interface FeedbackDraft {
  category: WorklistCategory
  subject: string
  description: string
  anonymous: boolean
}

/** Next EFG reference number, one past the highest already in the queue. */
function nextCode(): string {
  const max = entries.reduce((acc, e) => {
    const n = Number(e.code.replace('EFG-', ''))
    return Number.isFinite(n) && n > acc ? n : acc
  }, 0)
  return `EFG-${max + 1}`
}

/**
 * Employee self-service submission — files the entry as the signed-in mock
 * employee (`SELF_EMPLOYEE_ID`) with status "Submitted".
 */
export function submitFeedbackEntry(draft: FeedbackDraft): FeedbackWorklistEntry {
  const entry: FeedbackWorklistEntry = {
    id: `fbw-${crypto.randomUUID().slice(0, 8)}`,
    code: nextCode(),
    raisedById: SELF_EMPLOYEE_ID,
    category: draft.category,
    subject: draft.subject,
    description: draft.description,
    anonymous: draft.anonymous,
    submittedOn: new Date().toISOString().slice(0, 10),
    status: 'Submitted',
  }
  entries = [entry, ...entries]
  emit()
  return entry
}

/** Admin triage — move an entry one step along the review flow (EFG-05). */
export function advanceFeedbackEntry(id: string): FeedbackWorklistEntry | null {
  const target = entries.find((e) => e.id === id)
  if (!target) return null
  const next = NEXT_WORKLIST_STATUS[target.status]
  if (!next) return null
  const updated: FeedbackWorklistEntry = { ...target, status: next }
  entries = entries.map((e) => (e.id === id ? updated : e))
  emit()
  return updated
}

/** Subscribe to the live feedback / grievance queue. */
export function useFeedbackWorklist(): FeedbackWorklistEntry[] {
  return useSyncExternalStore(subscribe, getSnapshot)
}
