import { isContainer, makeId } from './model'
import type { WorkflowDoc } from './model'
import { createStep, getDef, sampleFor } from './registry'

/** Fresh empty workflow for "+ New workflow" — just a trigger and an end. */
export function blankDoc(): WorkflowDoc {
  return {
    id: makeId('wf'),
    name: 'Untitled workflow',
    status: 'draft',
    trigger: {
      id: makeId('t'), kind: 'moduleEvent', label: 'Module event',
      config: structuredClone(getDef('moduleEvent').defaultConfig),
    },
    body: [],
  }
}

/**
 * Seed flow — "Leave Approval — Standard": a Leave Management module event
 * routes through a Reporting Manager approval task; the decision branches to
 * an approval path (notify + balance update) or a rejection path (notify).
 * Every required field is filled so the seed validates and can Activate.
 */
export function seedDoc(): WorkflowDoc {
  const approval = createStep('approvalTask')
  approval.label = 'Manager approval'

  const notifyApproved = createStep('notify')
  notifyApproved.label = 'Notify employee — approved'
  notifyApproved.config.message =
    'Hi {{payload.employee.name}}, your {{payload.request.type}} leave ({{payload.request.days}} day(s)) was approved.'

  const updateBalance = createStep('updateRecord')
  updateBalance.label = 'Debit leave balance'
  updateBalance.config.field = 'leaveBalance'
  updateBalance.config.value = '{{payload.employee.balance - payload.request.days}}'

  const notifyRejected = createStep('notify')
  notifyRejected.label = 'Notify employee — rejected'
  notifyRejected.config.message =
    'Hi {{payload.employee.name}}, your {{payload.request.type}} leave was rejected by {{input.approver}}.'

  const decision = createStep('ifElse')
  decision.label = 'Approved?'
  if (isContainer(decision)) {
    decision.branches[0].config.cond = {
      kind: 'rule',
      field: 'input.decision',
      op: 'equals',
      value: 'approved',
    }
    decision.branches[0].steps = [notifyApproved, updateBalance]
    decision.branches[1].steps = [notifyRejected]
  }

  return {
    id: makeId('wf'),
    name: 'Leave Approval — Standard',
    status: 'draft',
    trigger: {
      id: makeId('t'), kind: 'moduleEvent', label: 'Leave request submitted',
      config: structuredClone(getDef('moduleEvent').defaultConfig),
    },
    body: [approval, decision],
  }
}

/**
 * Cross-module orchestration demo — one event in Employee Lifecycle fans out
 * into three OTHER modules: Asset Management (flag assets for collection),
 * Leave Management (encash remaining balance) and HR Letters (relieving
 * letter), then notifies the manager. Proof that a change in one module can
 * drive changes in any other module through a single flow.
 */
export function exitFlowDoc(): WorkflowDoc {
  const approval = createStep('approvalTask')
  approval.label = 'Exit approval'
  approval.config.approverRole = 'HR Director'
  approval.config.slaHours = 48

  const flagAssets = createStep('updateRecord')
  flagAssets.label = 'Flag assets for collection'
  flagAssets.config.module = 'Asset Management'
  flagAssets.config.field = 'returnStatus'
  flagAssets.config.value = 'Collection due {{payload.exit.lastWorkingDay}}'

  const encashLeave = createStep('updateRecord')
  encashLeave.label = 'Encash remaining leave'
  encashLeave.config.module = 'Leave Management'
  encashLeave.config.field = 'balanceAction'
  encashLeave.config.value = 'Encash on final settlement'

  const relievingLetter = createStep('generateDocument')
  relievingLetter.label = 'Generate relieving letter'
  relievingLetter.config.template = 'Relieving Letter'

  const effects = createStep('group')
  effects.label = 'Cross-module effects'
  if (isContainer(effects)) {
    effects.branches[0].steps = [flagAssets, encashLeave, relievingLetter]
  }

  const notifyManager = createStep('notify')
  notifyManager.label = 'Notify manager'
  notifyManager.config.recipient = 'Reporting Manager'
  notifyManager.config.message =
    'Exit approved for {{payload.employee.name}} — asset collection, leave encashment and relieving letter are in motion.'

  const trigger = {
    id: makeId('t'),
    kind: 'moduleEvent' as const,
    label: 'Exit initiated',
    config: {
      module: 'Employee Lifecycle',
      event: 'Exit initiated',
      samplePayload: sampleFor('Exit initiated'),
    },
  }

  return {
    id: makeId('wf'),
    name: 'Exit Orchestration — Cross-module',
    status: 'draft',
    trigger,
    body: [approval, effects, notifyManager],
  }
}
