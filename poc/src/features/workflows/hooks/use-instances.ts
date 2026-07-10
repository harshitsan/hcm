import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import type { WorkflowDefinition } from '../data/definitions'
import {
  seedInstances,
  seedTasks,
  type ApprovalTask,
  type InstanceStage,
  type TaskVia,
  type WorkflowInstance,
} from '../data/instances'
import { evaluateRouting, type RoutingRule } from '../data/routing'
import {
  DEFAULT_ESCALATION_TARGET,
  MANAGERS,
  ROLE_HOLDERS,
  type EscalationStrategy,
} from '../data/shared'
import { type AppendAudit } from './use-audit-trail'

export interface StartInstanceInput {
  title: string
  requester: string
  transactionType: string
  company: string
  jurisdiction: string
  location: string
  department: string
  orgGroup: string
}

interface EngineState {
  instances: WorkflowInstance[]
  tasks: ApprovalTask[]
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

const VIA_BY_STRATEGY: Record<EscalationStrategy, TaskVia> = {
  manager: 'manager',
  role: 'role',
  'time-reassignment': 'time-reassignment',
  'multi-level': 'multi-level',
}

function resolveEscalationTarget(
  stage: InstanceStage,
  fromApprover: string
): string {
  switch (stage.escalation) {
    case 'manager':
      return MANAGERS[fromApprover] ?? DEFAULT_ESCALATION_TARGET
    case 'role':
      return ROLE_HOLDERS[stage.escalationTarget] ?? DEFAULT_ESCALATION_TARGET
    case 'time-reassignment':
      return stage.escalationTarget in ROLE_HOLDERS
        ? ROLE_HOLDERS[stage.escalationTarget]
        : stage.escalationTarget || DEFAULT_ESCALATION_TARGET
    case 'multi-level':
      return (
        ROLE_HOLDERS[stage.escalationTarget] ??
        MANAGERS[fromApprover] ??
        DEFAULT_ESCALATION_TARGET
      )
  }
}

function makeTask(
  instance: WorkflowInstance,
  stage: InstanceStage,
  approver: string,
  via: TaskVia = 'normal',
  escalatedFrom: string | null = null
): ApprovalTask {
  return {
    id: `tsk-${crypto.randomUUID().slice(0, 8)}`,
    instanceId: instance.id,
    stageId: stage.id,
    stageName: stage.name,
    pattern: stage.pattern,
    approver,
    status: 'pending',
    via,
    slaPercent: 0,
    slaHours: stage.slaHours,
    assignedAt: today(),
    decidedAt: null,
    escalatedFrom,
  }
}

/** Opens a stage: sets its approvals per pattern and creates its tasks. */
function openStage(
  instance: WorkflowInstance,
  stage: InstanceStage
): ApprovalTask[] {
  stage.status = 'in-progress'
  if (stage.pattern === 'sequential') {
    stage.approvals = stage.approvals.map((a, i) => ({
      ...a,
      decision: i === 0 ? 'pending' : 'waiting',
    }))
    return [makeTask(instance, stage, stage.approvals[0].approver)]
  }
  stage.approvals = stage.approvals.map((a) => ({ ...a, decision: 'pending' }))
  return stage.approvals.map((a) => makeTask(instance, stage, a.approver))
}

// Module-level engine state so the approval inbox (Tasks & Notifications)
// and the Workflow Engine's monitoring surfaces share one live engine —
// a decision made in either place is reflected in both.
let engineState: EngineState = {
  instances: seedInstances,
  tasks: seedTasks,
}
const engineListeners = new Set<() => void>()

function setState(next: EngineState) {
  engineState = next
  engineListeners.forEach((l) => l())
}

function subscribeEngine(listener: () => void) {
  engineListeners.add(listener)
  return () => {
    engineListeners.delete(listener)
  }
}

function getEngineSnapshot() {
  return engineState
}

/**
 * In-memory workflow engine: instances + approval tasks with sequential /
 * parallel-any / parallel-all semantics (WFE-03..06, WFE-13), escalation
 * strategies (WFE-07, WFE-08, WFE-15), SLA reminders at 50/75 and
 * escalation at 100 (WFE-10, WFE-14) and routed initiation (WFE-02).
 */
export function useInstances({
  append,
  actor,
  actorRole,
}: {
  append: AppendAudit
  actor: string
  actorRole: string
}) {
  const state = useSyncExternalStore(subscribeEngine, getEngineSnapshot)

  const { instances, tasks } = state

  /** Highest SLA consumption across an instance's pending tasks (WFE-11). */
  const slaForInstance = useCallback(
    (instanceId: string) => {
      const pending = tasks.filter(
        (t) => t.instanceId === instanceId && t.status === 'pending'
      )
      if (pending.length === 0) return null
      return Math.max(...pending.map((t) => t.slaPercent))
    },
    [tasks]
  )

  const decide = useCallback(
    (taskId: string, decision: 'approved' | 'rejected') => {
      const task = tasks.find((t) => t.id === taskId)
      if (!task || task.status !== 'pending') return
      const instance = instances.find((i) => i.id === task.instanceId)
      if (!instance) return

      const inst: WorkflowInstance = {
        ...instance,
        stages: instance.stages.map((s) => ({
          ...s,
          approvals: s.approvals.map((a) => ({ ...a })),
        })),
      }
      const stage = inst.stages.find((s) => s.id === task.stageId)
      if (!stage) return

      let newTasks = tasks.map((t) =>
        t.id === taskId ? { ...t, status: decision, decidedAt: today() } : t
      )
      const approval = stage.approvals.find((a) => a.approver === task.approver)
      if (approval) approval.decision = decision

      if (decision === 'rejected') {
        // Any rejection halts the workflow; downstream approvers are never
        // engaged and sibling pending tasks are closed (WFE-03..06).
        stage.status = 'rejected'
        inst.status = 'rejected'
        inst.completedAt = today()
        stage.approvals.forEach((a) => {
          if (a.decision === 'pending' || a.decision === 'waiting')
            a.decision = 'closed'
        })
        newTasks = newTasks.map((t) =>
          t.instanceId === inst.id && t.status === 'pending'
            ? { ...t, status: 'closed' as const, decidedAt: today() }
            : t
        )
        append({
          actor,
          actorRole,
          company: inst.company,
          category: 'rejection',
          summary: `Rejected "${inst.title}" at ${stage.name}`,
          detail:
            'Workflow halted per rejection handling — sibling pending tasks closed, downstream stages not engaged.',
          refId: inst.id,
        })
        toast.success('Request rejected — workflow halted')
      } else {
        let stageComplete = false
        if (stage.pattern === 'sequential') {
          const next = stage.approvals.find((a) => a.decision === 'waiting')
          if (next) {
            next.decision = 'pending'
            newTasks = [makeTask(inst, stage, next.approver), ...newTasks]
            toast.success(`Approved — advanced to ${next.approver}`)
          } else {
            stageComplete = true
          }
        } else if (stage.pattern === 'parallel-any') {
          // Any-one-can-approve: remaining approvers' tasks are closed.
          stage.approvals.forEach((a) => {
            if (a.decision === 'pending') a.decision = 'closed'
          })
          newTasks = newTasks.map((t) =>
            t.instanceId === inst.id &&
            t.stageId === stage.id &&
            t.status === 'pending'
              ? { ...t, status: 'closed' as const, decidedAt: today() }
              : t
          )
          stageComplete = true
        } else {
          // All-must-approve: complete only when every approver has approved.
          stageComplete = stage.approvals.every(
            (a) => a.decision === 'approved'
          )
          if (!stageComplete)
            toast.success('Approval recorded — waiting on remaining approvers')
        }

        if (stageComplete) {
          stage.status = 'approved'
          const idx = inst.stages.findIndex((s) => s.id === stage.id)
          const nextStage = inst.stages[idx + 1]
          if (nextStage) {
            inst.currentStageIndex = idx + 1
            newTasks = [...openStage(inst, nextStage), ...newTasks]
            toast.success(`Stage complete — advanced to "${nextStage.name}"`)
          } else {
            inst.status = 'approved'
            inst.completedAt = today()
            toast.success('Request fully approved')
          }
        }
        append({
          actor,
          actorRole,
          company: inst.company,
          category: 'approval',
          summary: `Approved "${inst.title}" at ${stage.name}`,
          detail: `Pattern: ${stage.pattern}. ${
            inst.status === 'approved'
              ? 'Request reached approved terminal state.'
              : stageComplete
                ? 'Stage complete — workflow advanced.'
                : 'Decision recorded; step still pending per all-must-approve rule.'
          }`,
          refId: inst.id,
        })
      }

      setState({
        instances: instances.map((i) => (i.id === inst.id ? inst : i)),
        tasks: newTasks,
      })
    },
    [instances, tasks, append, actor, actorRole]
  )

  /** Escalates one pending task per its stage strategy (WFE-07, WFE-08). */
  const escalateTask = useCallback(
    (taskId: string, reason: string) => {
      const task = tasks.find((t) => t.id === taskId)
      if (!task || task.status !== 'pending') return
      const instance = instances.find((i) => i.id === task.instanceId)
      if (!instance) return
      const stage = instance.stages.find((s) => s.id === task.stageId)
      if (!stage) return

      const target = resolveEscalationTarget(stage, task.approver)
      const inst: WorkflowInstance = {
        ...instance,
        stages: instance.stages.map((s) =>
          s.id !== stage.id
            ? s
            : {
                ...s,
                approvals: [
                  ...s.approvals.map((a) =>
                    a.approver === task.approver && a.decision === 'pending'
                      ? { ...a, decision: 'closed' as const }
                      : a
                  ),
                  { approver: target, decision: 'pending' as const },
                ],
              }
        ),
      }
      const replacement = makeTask(
        inst,
        stage,
        target,
        VIA_BY_STRATEGY[stage.escalation],
        task.approver
      )
      setState({
        instances: instances.map((i) => (i.id === inst.id ? inst : i)),
        tasks: [
          replacement,
          ...tasks.map((t) =>
            t.id === taskId ? { ...t, status: 'escalated' as const } : t
          ),
        ],
      })
      append({
        actor: 'Workflow Engine',
        actorRole: 'System',
        company: inst.company,
        category: 'escalation',
        summary: `Escalated ${task.approver} → ${target} (${stage.escalation})`,
        detail: `Reason: ${reason}. Instance ${inst.id} · stage "${stage.name}". New approver notified with SLA context.`,
        refId: inst.id,
      })
      toast.success(`Escalated to ${target}`)
    },
    [instances, tasks, append]
  )

  /**
   * Simulates the business-hours SLA clock advancing 25% (WFE-09..11):
   * reminders fire crossing 50/75, escalation fires crossing 100.
   */
  const tickSla = useCallback(() => {
    let reminders = 0
    let escalations = 0
    const replacements: ApprovalTask[] = []
    const nextInstances = instances.map((i) => ({
      ...i,
      stages: i.stages.map((s) => ({
        ...s,
        approvals: s.approvals.map((a) => ({ ...a })),
      })),
    }))

    const nextTasks: ApprovalTask[] = tasks.map((t) => {
      if (t.status !== 'pending') return t
      const inst = nextInstances.find((x) => x.id === t.instanceId)
      if (!inst || inst.status !== 'in-progress') return t
      const next = t.slaPercent + 25
      for (const th of [50, 75]) {
        if (t.slaPercent < th && next >= th) {
          reminders += 1
          append({
            actor: 'Workflow Engine',
            actorRole: 'System',
            company: inst.company,
            category: 'reminder',
            summary: `${th}% SLA reminder sent to ${t.approver}`,
            detail: `Instance ${inst.id} · stage "${t.stageName}" at ${next}% of its ${t.slaHours} business-hour SLA.`,
            refId: inst.id,
          })
        }
      }
      if (t.slaPercent < 100 && next >= 100) {
        // 100% breach: escalate away from the current approver (WFE-10).
        const stage = inst.stages.find((s) => s.id === t.stageId)
        if (stage) {
          const target = resolveEscalationTarget(stage, t.approver)
          const mine = stage.approvals.find(
            (a) => a.approver === t.approver && a.decision === 'pending'
          )
          if (mine) mine.decision = 'closed'
          stage.approvals.push({ approver: target, decision: 'pending' })
          replacements.push(
            makeTask(inst, stage, target, VIA_BY_STRATEGY[stage.escalation], t.approver)
          )
          escalations += 1
          append({
            actor: 'Workflow Engine',
            actorRole: 'System',
            company: inst.company,
            category: 'escalation',
            summary: `Escalated ${t.approver} → ${target} (${stage.escalation})`,
            detail: `Reason: SLA 100% breached on stage "${stage.name}". Request redirected per configured strategy; new approver notified.`,
            refId: inst.id,
          })
          return { ...t, slaPercent: next, status: 'escalated' as const }
        }
      }
      return { ...t, slaPercent: next }
    })

    setState({
      instances: nextInstances,
      tasks: [...replacements, ...nextTasks],
    })
    toast.info(
      `SLA clock advanced 25% — ${reminders} reminder${reminders === 1 ? '' : 's'} sent, ${escalations} escalation${escalations === 1 ? '' : 's'} fired`
    )
  }, [instances, tasks, append])

  const sendReminder = useCallback(
    (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId)
      if (!task) return
      const inst = instances.find((i) => i.id === task.instanceId)
      append({
        actor,
        actorRole,
        company: inst?.company ?? '—',
        category: 'reminder',
        summary: `Manual reminder sent to ${task.approver}`,
        detail: `Nudge for "${task.stageName}" at ${task.slaPercent}% SLA consumption.`,
        refId: task.instanceId,
      })
      toast.success(`Reminder sent to ${task.approver}`)
    },
    [instances, tasks, append, actor, actorRole]
  )

  /** Initiates a transaction through the routing decision table (WFE-02). */
  const startInstance = useCallback(
    (
      input: StartInstanceInput,
      rules: RoutingRule[],
      definitions: WorkflowDefinition[]
    ) => {
      const routed = evaluateRouting(rules, input)
      const def =
        (routed &&
          definitions.find(
            (d) => d.name === routed.rule.routeTo && d.status === 'active'
          )) ??
        definitions.find(
          (d) =>
            d.transactionType === input.transactionType && d.status === 'active'
        )
      if (!def) {
        toast.error('No active workflow definition matches this transaction')
        return
      }
      const instance: WorkflowInstance = {
        id: `ins-${crypto.randomUUID().slice(0, 8)}`,
        title: input.title,
        transactionType: def.transactionType,
        requester: input.requester,
        company: input.company,
        department: input.department,
        location: input.location,
        definitionName: def.name,
        definitionVersion: def.version,
        status: 'in-progress',
        startedAt: today(),
        completedAt: null,
        currentStageIndex: 0,
        stages: def.stages.map((s) => ({
          id: s.id,
          name: s.name,
          pattern: s.pattern,
          status: 'waiting',
          approvals: s.approvers.map((a) => ({
            approver: a,
            decision: 'waiting' as const,
          })),
          escalation: s.escalation,
          escalationTarget: s.escalationTarget,
          slaHours: s.slaHours,
        })),
      }
      const firstTasks = openStage(instance, instance.stages[0])
      setState({
        instances: [instance, ...instances],
        tasks: [...firstTasks, ...tasks],
      })
      append({
        actor: 'Workflow Engine',
        actorRole: 'System',
        company: input.company,
        category: 'routing',
        summary: `Routed "${input.title}"`,
        detail: routed
          ? `Matched rule ${routed.rule.id} (priority ${routed.rule.priority}${routed.matchedOnDefault ? ' · default row' : ''}) → ${def.name} v${def.version}. Bound to version effective ${def.effectiveFrom}.`
          : `No rule matched — routed by transaction type to ${def.name} v${def.version}.`,
        refId: instance.id,
      })
      toast.success(
        `Routed to ${def.name} v${def.version}${routed?.matchedOnDefault ? ' via default path' : ''}`
      )
    },
    [instances, tasks, append]
  )

  const pendingTasks = useMemo(
    () => tasks.filter((t) => t.status === 'pending'),
    [tasks]
  )

  return {
    instances,
    tasks,
    pendingTasks,
    slaForInstance,
    decide,
    escalateTask,
    tickSla,
    sendReminder,
    startInstance,
  }
}

export type InstancesStore = ReturnType<typeof useInstances>
