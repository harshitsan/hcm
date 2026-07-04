import { isContainer, makeId } from './model'
import type { WorkflowDoc } from './model'
import { createStep, getDef } from './registry'

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
