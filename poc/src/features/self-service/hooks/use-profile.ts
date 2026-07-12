import { useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import { publishAuditEvent } from '@/features/audit-logs/data/live-trail'
import {
  COMP_DARK_FIELD_IDS,
  CURRENT_EMPLOYEE,
  CURRENT_TENANT,
  EDIT_POLICY_LABELS,
  PROFILE_FIELD_GROUPS,
  seedChangeRequests,
  seedGroupPolicies,
  seedProfileFields,
  seedProfileValues,
  seedRecordVersions,
  type ChangeRequest,
  type EditPolicy,
  type FieldMode,
  type ProfileField,
  type RecordVersion,
} from '../data/profile'

export type UdfDraft = Pick<
  ProfileField,
  'label' | 'section' | 'mode' | 'approvalRequired' | 'minLength'
>

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function now(): string {
  return new Date().toISOString().slice(0, 16).replace('T', ' ')
}

interface ProfileState {
  fields: ProfileField[]
  values: Record<string, string>
  changeRequests: ChangeRequest[]
  versions: RecordVersion[]
  /** Company Admin edit policy per field group — drives the rule engine. */
  groupPolicies: Record<string, EditPolicy>
}

/**
 * Module-level profile store shared via useSyncExternalStore: the metadata
 * field schema (ESS-14/16), values, approval-routed change requests (ESS-15),
 * the bitemporal version log (ESS-12) and the per-group edit policy. State
 * survives navigation and role switches so a change an employee submits is
 * still pending when an admin opens the approvals queue.
 */
let state: ProfileState = {
  fields: seedProfileFields,
  values: seedProfileValues,
  changeRequests: seedChangeRequests,
  versions: seedRecordVersions,
  groupPolicies: seedGroupPolicies,
}

const listeners = new Set<() => void>()

function setState(patch: Partial<ProfileState>) {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Applies a value and appends an effective-dated version (never overwrites). */
function appendVersion(
  field: ProfileField,
  value: string,
  changedBy: string,
  kind: RecordVersion['kind']
) {
  const version: RecordVersion = {
    id: `rv-${crypto.randomUUID().slice(0, 8)}`,
    fieldLabel: field.label,
    value,
    previousValue: state.values[field.id] ?? '—',
    validFrom: today(),
    recordedAt: now(),
    changedBy,
    kind,
    tenant: CURRENT_TENANT,
    employee: CURRENT_EMPLOYEE,
  }
  setState({
    versions: [version, ...state.versions],
    values: { ...state.values, [field.id]: value },
  })
}

/**
 * Employee edit — the rule engine: self-serve fields apply immediately;
 * sensitive (approval-required) fields become a pending change request and
 * the prior value stays in effect until the request is approved.
 */
function submitChange(field: ProfileField, newValue: string, reason = '') {
  const previousValue = state.values[field.id] ?? ''
  if (field.approvalRequired) {
    const request: ChangeRequest = {
      id: `cr-${crypto.randomUUID().slice(0, 8)}`,
      fieldId: field.id,
      fieldLabel: field.label,
      currentValue: previousValue,
      requestedValue: newValue,
      reason,
      requestedBy: CURRENT_EMPLOYEE,
      submittedOn: today(),
      status: 'Pending approval',
      approverGraph: ['Vikram Mehta', 'HR Partner'],
      pendingWith: 'Vikram Mehta',
      decidedBy: null,
      decidedOn: null,
      decisionComment: null,
    }
    setState({ changeRequests: [request, ...state.changeRequests] })
    publishAuditEvent({
      module: 'Self Service',
      action: 'Profile change request submitted',
      actor: CURRENT_EMPLOYEE,
      actorRole: 'Employee',
      entityType: 'Employee',
      actionType: 'create',
      recordId: request.id,
      recordName: `Change request — ${field.label}`,
      changes: [
        {
          field: field.label,
          previousValue,
          newValue: `${newValue} (pending approval)`,
        },
      ],
    })
    toast.success(
      `${field.label} change submitted for approval — the current value stays in effect until it is approved`
    )
    return
  }
  appendVersion(field, newValue, 'Self-service', 'update')
  publishAuditEvent({
    module: 'Self Service',
    action: 'Profile field updated',
    actor: CURRENT_EMPLOYEE,
    actorRole: 'Employee',
    entityType: 'Employee',
    actionType: 'update',
    recordId: field.id,
    recordName: `Profile — ${CURRENT_EMPLOYEE}`,
    changes: [{ field: field.label, previousValue, newValue }],
  })
  toast.success(`${field.label} updated — new effective-dated version recorded`)
}

/** Approver decision: applies the requested value to the profile record. */
function approveChange(id: string, comment = '') {
  const request = state.changeRequests.find((cr) => cr.id === id)
  if (!request || request.status !== 'Pending approval') return
  const field = state.fields.find((f) => f.id === request.fieldId)
  if (field) {
    appendVersion(
      field,
      request.requestedValue,
      'Self-service (approved)',
      'update'
    )
  }
  setState({
    changeRequests: state.changeRequests.map((cr) =>
      cr.id === id
        ? {
            ...cr,
            status: 'Approved' as const,
            pendingWith: null,
            decidedBy: 'Company Admin',
            decidedOn: today(),
            decisionComment: comment || null,
          }
        : cr
    ),
  })
  publishAuditEvent({
    module: 'Self Service',
    action: 'Profile change request approved',
    actor: 'Meera Iyer',
    actorRole: 'Company Admin',
    entityType: 'Employee',
    actionType: 'status-change',
    recordId: request.id,
    recordName: `Change request — ${request.fieldLabel}`,
    changes: [
      {
        field: request.fieldLabel,
        previousValue: request.currentValue,
        newValue: request.requestedValue,
      },
      { field: 'Status', previousValue: 'Pending approval', newValue: 'Approved' },
    ],
  })
  toast.success(
    'Change approved — the new value now applies to the profile record'
  )
}

/** Approver decision: keeps the old value; the request is closed as rejected. */
function rejectChange(id: string, comment = '') {
  const request = state.changeRequests.find((cr) => cr.id === id)
  if (!request || request.status !== 'Pending approval') return
  setState({
    changeRequests: state.changeRequests.map((cr) =>
      cr.id === id
        ? {
            ...cr,
            status: 'Rejected' as const,
            pendingWith: null,
            decidedBy: 'Company Admin',
            decidedOn: today(),
            decisionComment: comment || null,
          }
        : cr
    ),
  })
  publishAuditEvent({
    module: 'Self Service',
    action: 'Profile change request rejected',
    actor: 'Meera Iyer',
    actorRole: 'Company Admin',
    entityType: 'Employee',
    actionType: 'status-change',
    recordId: request.id,
    recordName: `Change request — ${request.fieldLabel}`,
    changes: [
      { field: 'Status', previousValue: 'Pending approval', newValue: 'Rejected' },
    ],
  })
  toast.success('Change rejected — the record keeps its current value')
}

/** Company Admin: flip a field between editable / view-only / hidden (ESS-11). */
function setFieldMode(fieldId: string, mode: FieldMode) {
  if ((COMP_DARK_FIELD_IDS as readonly string[]).includes(fieldId)) {
    toast.error(
      'Compensation fields stay hidden in Phase 1 — this cannot be changed by configuration.'
    )
    return
  }
  const field = state.fields.find((f) => f.id === fieldId)
  setState({
    fields: state.fields.map((f) =>
      f.id === fieldId ? { ...f, mode, effectiveFrom: today() } : f
    ),
  })
  publishAuditEvent({
    module: 'Self Service',
    action: 'Profile field configuration changed',
    actor: 'Meera Iyer',
    actorRole: 'Company Admin',
    entityType: 'Company',
    actionType: 'update',
    recordId: fieldId,
    recordName: `Field policy — ${field?.label ?? fieldId}`,
    changes: [
      { field: 'Mode', previousValue: field?.mode ?? null, newValue: mode },
    ],
  })
  toast.success('Field configuration published — applies to subsequent sessions')
}

function toggleApprovalRequired(fieldId: string) {
  const field = state.fields.find((f) => f.id === fieldId)
  if (!field) return
  setState({
    fields: state.fields.map((f) =>
      f.id === fieldId ? { ...f, approvalRequired: !f.approvalRequired } : f
    ),
  })
  publishAuditEvent({
    module: 'Self Service',
    action: 'Profile field approval routing changed',
    actor: 'Meera Iyer',
    actorRole: 'Company Admin',
    entityType: 'Company',
    actionType: 'update',
    recordId: fieldId,
    recordName: `Field policy — ${field.label}`,
    changes: [
      {
        field: 'Approval required',
        previousValue: field.approvalRequired ? 'Yes' : 'No',
        newValue: field.approvalRequired ? 'No' : 'Yes',
      },
    ],
  })
  toast.success('Approval routing updated for the field')
}

/**
 * Company Admin: set the edit policy for a whole field group — e.g.
 * "Address — direct edit", "Legal name — approval required", "Bank details —
 * HR only". Member fields are reconfigured to match, so the rule engine
 * applies the policy on the employee's next edit.
 */
function setGroupPolicy(groupId: string, policy: EditPolicy) {
  const group = PROFILE_FIELD_GROUPS.find((g) => g.id === groupId)
  if (!group) return
  const previous = state.groupPolicies[groupId]
  const memberIds = new Set(group.fieldIds)
  setState({
    groupPolicies: { ...state.groupPolicies, [groupId]: policy },
    fields: state.fields.map((f) =>
      memberIds.has(f.id)
        ? {
            ...f,
            mode: policy === 'hr-only' ? 'hidden' : 'editable',
            approvalRequired: policy !== 'direct',
            effectiveFrom: today(),
          }
        : f
    ),
  })
  publishAuditEvent({
    module: 'Self Service',
    action: 'Profile edit policy changed',
    actor: 'Meera Iyer',
    actorRole: 'Company Admin',
    entityType: 'Company',
    actionType: 'update',
    recordId: groupId,
    recordName: `Edit policy — ${group.label}`,
    changes: [
      {
        field: group.label,
        previousValue: previous ? EDIT_POLICY_LABELS[previous] : null,
        newValue: EDIT_POLICY_LABELS[policy],
      },
    ],
  })
  toast.success(
    `${group.label} — now "${EDIT_POLICY_LABELS[policy]}" for employees`
  )
}

/** Company Admin: add a custom field to the metadata schema (ESS-14). */
function addUdf(draft: UdfDraft) {
  const id = `udf-${crypto.randomUUID().slice(0, 8)}`
  setState({
    fields: [
      ...state.fields,
      {
        id,
        label: `${draft.label} (UDF)`,
        section: draft.section,
        mode: draft.mode,
        approvalRequired: draft.approvalRequired,
        isUdf: true,
        inputType: 'text',
        minLength: draft.minLength,
        effectiveFrom: today(),
      },
    ],
    values: { ...state.values, [id]: '—' },
  })
  publishAuditEvent({
    module: 'Self Service',
    action: 'Custom profile field added',
    actor: 'Meera Iyer',
    actorRole: 'Company Admin',
    entityType: 'Company',
    actionType: 'create',
    recordId: id,
    recordName: `Field policy — ${draft.label} (UDF)`,
  })
  toast.success(
    `UDF "${draft.label}" added to the self-service schema — no code change needed`
  )
}

export function useProfile() {
  const snapshot = useSyncExternalStore(subscribe, () => state)
  return {
    fields: snapshot.fields,
    values: snapshot.values,
    changeRequests: snapshot.changeRequests,
    versions: snapshot.versions,
    groupPolicies: snapshot.groupPolicies,
    submitChange,
    approveChange,
    rejectChange,
    setFieldMode,
    toggleApprovalRequired,
    setGroupPolicy,
    addUdf,
  }
}

export type ProfileStore = ReturnType<typeof useProfile>
