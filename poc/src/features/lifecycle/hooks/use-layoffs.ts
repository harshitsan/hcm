import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { type ExitTypeDef } from '../data/config'
import {
  LAYOFF_FALLBACK_APPROVER,
  LAYOFF_HR_APPROVER,
  LOCATION_HEADCOUNT,
  seedLayoffs,
  type LayoffBatch,
  type LayoffEmployee,
} from '../data/layoffs'
import { makeSteps, pendingStep, shortId, todayISO } from '../data/shared'
import { type LogInput } from './use-lifecycle-log'

export interface LayoffDraft {
  name: string
  location: string
  reason: string
  employees: LayoffEmployee[]
}

interface Deps {
  log: (input: Omit<LogInput, 'actor' | 'actorRole'>) => void
  notify: (input: {
    recipient: string
    kind: 'task' | 'approval' | 'reminder' | 'escalation'
    title: string
    body: string
  }) => void
  /** The seeded Layoff exit type (min employees + location approvers). */
  layoffConfig: ExitTypeDef | undefined
  /** Opens an exit case per employee when an approved batch records exits. */
  onExit: (employee: LayoffEmployee, batch: LayoffBatch) => void
}

const COMPANY = 'Aurora Software India'

/** Batches still counting against the location headcount. */
const COUNTED_STATUSES = ['pending-approval', 'approved', 'exited'] as const

/**
 * Layoff store — bulk initiation, min-headcount guard and routing through
 * the location approvers seeded in Configuration → Exit → Layoff.
 */
export function useLayoffs({ log, notify, layoffConfig, onExit }: Deps) {
  const [batches, setBatches] = useState<LayoffBatch[]>(seedLayoffs)

  const minEmployees = layoffConfig?.minEmployees ?? 10

  const patch = useCallback((id: string, fn: (b: LayoffBatch) => LayoffBatch) => {
    setBatches((prev) => prev.map((b) => (b.id === id ? fn(b) : b)))
  }, [])

  /** Seeded location approver, or the group-admin fallback. */
  const approverForLocation = useCallback(
    (location: string) =>
      layoffConfig?.layoffApproversByLocation?.find(
        (a) => a.location === location
      )?.approver ?? LAYOFF_FALLBACK_APPROVER,
    [layoffConfig]
  )

  /** Headcount already committed to in-flight/exited batches at a location. */
  const committedAt = useCallback(
    (location: string) =>
      batches
        .filter(
          (b) =>
            b.location === location &&
            (COUNTED_STATUSES as readonly string[]).includes(b.status)
        )
        .reduce((sum, b) => sum + b.employees.length, 0),
    [batches]
  )

  /** Remaining headcount at a location after laying off `selecting` more. */
  const remainingAfter = useCallback(
    (location: string, selecting: number) =>
      (LOCATION_HEADCOUNT[location] ?? 0) - committedAt(location) - selecting,
    [committedAt]
  )

  const initiateLayoff = useCallback(
    (draft: LayoffDraft) => {
      if (draft.employees.length === 0) {
        toast.error('Select at least one employee to initiate a layoff')
        return null
      }
      const remaining = remainingAfter(draft.location, draft.employees.length)
      if (remaining < minEmployees) {
        toast.error(
          `Blocked — laying off ${draft.employees.length} employee(s) leaves ${remaining} at ${draft.location}, below the configured minimum of ${minEmployees}`
        )
        log({
          company: COMPANY,
          module: 'Layoff',
          action: 'Layoff initiation blocked',
          target: `${draft.name} · ${draft.location}`,
          outcome: `Min-employee guard: remaining headcount ${remaining} < minimum ${minEmployees}`,
          onBehalfOf: null,
        })
        return null
      }
      const approver = approverForLocation(draft.location)
      const batch: LayoffBatch = {
        id: shortId('lay'),
        name: draft.name,
        location: draft.location,
        initiatedOn: todayISO(),
        initiatedBy: 'Anita Desai',
        reason: draft.reason,
        employees: draft.employees,
        status: 'pending-approval',
        approvals: makeSteps([
          { role: 'Location Approver', approver },
          { role: 'HR', approver: LAYOFF_HR_APPROVER },
        ]),
      }
      setBatches((prev) => [batch, ...prev])
      log({
        company: COMPANY,
        module: 'Layoff',
        action: 'Layoff initiated (bulk)',
        target: `${batch.id} · ${draft.name}`,
        outcome: `${draft.employees.length} employee(s) at ${draft.location} · routed to location approver ${approver} · remaining headcount ${remaining} ≥ minimum ${minEmployees}`,
        onBehalfOf: null,
      })
      notify({
        recipient: approver,
        kind: 'approval',
        title: `Layoff approval — ${draft.name}`,
        body: `${draft.employees.length} employee(s) at ${draft.location} pending your approval as location approver.`,
      })
      toast.success(
        `Layoff initiated for ${draft.employees.length} employee(s) — routed to ${approver} (${draft.location} approver)`
      )
      return batch
    },
    [approverForLocation, log, minEmployees, notify, remainingAfter]
  )

  const approveStep = useCallback(
    (b: LayoffBatch) => {
      const step = pendingStep(b.approvals)
      if (!step) return
      const approvals = b.approvals.map((s) =>
        s === step
          ? { ...s, status: 'approved' as const, actedOn: todayISO() }
          : s
      )
      const done = approvals.every((s) => s.status === 'approved')
      patch(b.id, (prev) => ({
        ...prev,
        approvals,
        status: done ? 'approved' : prev.status,
      }))
      log({
        company: COMPANY,
        module: 'Layoff',
        action: `Layoff approval granted (${step.role})`,
        target: `${b.id} · ${b.name}`,
        outcome: done
          ? `Batch approved — ${b.employees.length} employee(s) ready for exit processing`
          : 'Awaiting next approver',
        onBehalfOf: null,
      })
      toast.success(
        done ? 'Layoff batch fully approved' : `${step.role} approved`
      )
    },
    [log, patch]
  )

  const rejectStep = useCallback(
    (b: LayoffBatch, note: string) => {
      const step = pendingStep(b.approvals)
      if (!step) return
      patch(b.id, (prev) => ({
        ...prev,
        status: 'rejected',
        approvals: prev.approvals.map((s) =>
          s === step
            ? { ...s, status: 'rejected' as const, actedOn: todayISO(), note }
            : s
        ),
      }))
      log({
        company: COMPANY,
        module: 'Layoff',
        action: `Layoff rejected (${step.role})`,
        target: `${b.id} · ${b.name}`,
        outcome: `Batch returned — headcount released back to ${b.location}`,
        onBehalfOf: null,
      })
      toast.info('Layoff batch rejected — headcount released')
    },
    [log, patch]
  )

  /** Withdraw a batch before final approval. */
  const withdrawBatch = useCallback(
    (b: LayoffBatch) => {
      patch(b.id, (prev) => ({ ...prev, status: 'withdrawn' }))
      log({
        company: COMPANY,
        module: 'Layoff',
        action: 'Layoff withdrawn',
        target: `${b.id} · ${b.name}`,
        outcome: `Withdrawn before final approval — headcount released back to ${b.location}`,
        onBehalfOf: null,
      })
      toast.success('Layoff batch withdrawn')
    },
    [log, patch]
  )

  /** Approved batch → open an exit case per employee and mark exited. */
  const recordExits = useCallback(
    (b: LayoffBatch) => {
      patch(b.id, (prev) => ({ ...prev, status: 'exited' }))
      b.employees.forEach((emp) => onExit(emp, b))
      log({
        company: COMPANY,
        module: 'Layoff',
        action: 'Layoff exits recorded',
        target: `${b.id} · ${b.name}`,
        outcome: `${b.employees.length} exit case(s) opened with exit type Layoff`,
        onBehalfOf: null,
      })
      toast.success(
        `${b.employees.length} exit case(s) opened — see the Exits tab`
      )
    },
    [log, onExit, patch]
  )

  return {
    batches,
    minEmployees,
    approverForLocation,
    remainingAfter,
    initiateLayoff,
    approveStep,
    rejectStep,
    withdrawBatch,
    recordExits,
  }
}

export type LayoffsStore = ReturnType<typeof useLayoffs>
