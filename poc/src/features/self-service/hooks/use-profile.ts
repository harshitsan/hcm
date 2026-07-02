import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  CURRENT_EMPLOYEE,
  CURRENT_TENANT,
  seedChangeRequests,
  seedProfileFields,
  seedProfileValues,
  seedRecordVersions,
  type ChangeRequest,
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

/**
 * In-memory profile store: metadata-driven field schema (ESS-14/16), values,
 * approval-routed change requests (ESS-15) and the bitemporal version log
 * (ESS-12). Every applied change appends a version instead of overwriting.
 */
export function useProfile() {
  const [fields, setFields] = useState<ProfileField[]>(seedProfileFields)
  const [values, setValues] = useState<Record<string, string>>(
    seedProfileValues
  )
  const [changeRequests, setChangeRequests] =
    useState<ChangeRequest[]>(seedChangeRequests)
  const [versions, setVersions] = useState<RecordVersion[]>(seedRecordVersions)

  const appendVersion = useCallback(
    (field: ProfileField, value: string, changedBy: string, kind: RecordVersion['kind']) => {
      const version: RecordVersion = {
        id: `rv-${crypto.randomUUID().slice(0, 8)}`,
        fieldLabel: field.label,
        value,
        previousValue: values[field.id] ?? '—',
        validFrom: today(),
        recordedAt: now(),
        changedBy,
        kind,
        tenant: CURRENT_TENANT,
        employee: CURRENT_EMPLOYEE,
      }
      setVersions((v) => [version, ...v])
      setValues((prev) => ({ ...prev, [field.id]: value }))
    },
    [values]
  )

  /** Employee edit: applies directly or routes via the approval engine. */
  const submitChange = useCallback(
    (field: ProfileField, newValue: string) => {
      if (field.approvalRequired) {
        setChangeRequests((prev) => [
          {
            id: `cr-${crypto.randomUUID().slice(0, 8)}`,
            fieldId: field.id,
            fieldLabel: field.label,
            currentValue: values[field.id] ?? '',
            requestedValue: newValue,
            submittedOn: today(),
            status: 'Pending approval',
            approverGraph: ['Vikram Mehta', 'HR Partner'],
            pendingWith: 'Vikram Mehta',
          },
          ...prev,
        ])
        toast.success(
          `${field.label} change routed to the approver graph — prior value stays in effect until approved`
        )
        return
      }
      appendVersion(field, newValue, 'Self-service', 'update')
      toast.success(`${field.label} updated — new effective-dated version recorded`)
    },
    [appendVersion, values]
  )

  const approveChange = useCallback(
    (id: string) => {
      const request = changeRequests.find((cr) => cr.id === id)
      if (!request) return
      const field = fields.find((f) => f.id === request.fieldId)
      if (field) {
        appendVersion(field, request.requestedValue, 'Self-service (approved)', 'update')
      }
      setChangeRequests((prev) =>
        prev.map((cr) =>
          cr.id === id ? { ...cr, status: 'Approved', pendingWith: null } : cr
        )
      )
      toast.success('Change approved and applied to the canonical record')
    },
    [changeRequests, fields, appendVersion]
  )

  const rejectChange = useCallback((id: string) => {
    setChangeRequests((prev) =>
      prev.map((cr) =>
        cr.id === id ? { ...cr, status: 'Rejected', pendingWith: null } : cr
      )
    )
    toast.success('Change rejected — the record is unchanged')
  }, [])

  /** Company Admin: flip a field between editable / view-only / hidden (ESS-11). */
  const setFieldMode = useCallback((fieldId: string, mode: FieldMode) => {
    setFields((prev) =>
      prev.map((f) =>
        f.id === fieldId ? { ...f, mode, effectiveFrom: today() } : f
      )
    )
    toast.success('Field configuration published — applies to subsequent sessions')
  }, [])

  const toggleApprovalRequired = useCallback((fieldId: string) => {
    setFields((prev) =>
      prev.map((f) =>
        f.id === fieldId ? { ...f, approvalRequired: !f.approvalRequired } : f
      )
    )
    toast.success('Approval routing updated for the field')
  }, [])

  /** Company Admin: add a custom field to the metadata schema (ESS-14). */
  const addUdf = useCallback((draft: UdfDraft) => {
    const id = `udf-${crypto.randomUUID().slice(0, 8)}`
    setFields((prev) => [
      ...prev,
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
    ])
    setValues((prev) => ({ ...prev, [id]: '—' }))
    toast.success(`UDF "${draft.label}" added to the self-service schema — no code change needed`)
  }, [])

  return {
    fields,
    values,
    changeRequests,
    versions,
    submitChange,
    approveChange,
    rejectChange,
    setFieldMode,
    toggleApprovalRequired,
    addUdf,
  }
}

export type ProfileStore = ReturnType<typeof useProfile>
