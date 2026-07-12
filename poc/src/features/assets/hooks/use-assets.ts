import { useCallback, useState, useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import { publishAuditEvent } from '@/features/audit-logs/data/live-trail'
import {
  seedAcknowledgements,
  seedWorkflowTasks,
  type Acknowledgement,
  type AckResponse,
  type AckType,
  type WorkflowTask,
} from '../data/acknowledgements'
import { getAssetsSnapshot, mutateAssets, subscribeAssets } from '../data/asset-store'
import {
  ACTION_LABELS,
  type Asset,
  type AssetAction,
  type AssetHistoryEntry,
  type AssetState,
  type AssignmentOrigin,
} from '../data/assets'
import { denialReason, findRule, type AckRules } from '../data/config'
import { type ArrivalRecord } from '../data/movements'
import { CURRENT_ADMIN, employeeName, nowIso, todayIso } from '../data/org'

export interface AssetDraft {
  assetTag: string
  serial: string
  name: string
  category: string
  vendor: string
  poDate: string
  warrantyMonths: number
  value: number
}

export interface TransactionOptions {
  employeeId?: string | null
  effectiveDate: string
  expectedReturnDate?: string | null
  note?: string
  /** Workflow the movement originates from (onboarding, transfer, exit). */
  origin?: AssignmentOrigin | null
}

/** Routing note stamped on every asset reported lost. */
export const LOST_ROUTING_NOTE =
  'Forwarded to disciplinary review / recovery process'

function historyEntry(
  event: string,
  priorState: AssetState | null,
  newState: AssetState,
  employee: string | null,
  effectiveDate: string,
  ruleId: string | null,
  note = '',
  origin: AssignmentOrigin | null = null
): AssetHistoryEntry {
  return {
    id: `ah-${crypto.randomUUID().slice(0, 8)}`,
    event,
    priorState,
    newState,
    actor: CURRENT_ADMIN,
    employee,
    effectiveDate,
    recordedAt: nowIso(),
    ruleId,
    origin,
    note,
  }
}

/** Mirrors an asset mutation into the central audit trail. */
function auditAsset(
  action: string,
  asset: Pick<Asset, 'assetTag' | 'name'>,
  changes: { field: string; previousValue: string | null; newValue: string | null }[],
  actionType: 'create' | 'update' | 'status-change' = 'status-change'
) {
  publishAuditEvent({
    module: 'Asset Management',
    action,
    actor: CURRENT_ADMIN,
    actorRole: 'Company Admin',
    actionType,
    recordId: asset.assetTag,
    recordName: `${asset.assetTag} · ${asset.name}`,
    changes,
  })
}

/**
 * Canonical asset store: master records, lifecycle transactions validated
 * against the rules-engine decision table (ASM-23), append-only bitemporal
 * history (ASM-17), acknowledgements (ASM-07/08/14) and the workflow-engine
 * asset tasks (ASM-09/25). The asset list itself lives in the module-level
 * external store (data/asset-store.ts) so the exit-clearance bridge in
 * data/exit-clearance.ts reads the same live data as this page.
 */
export function useAssets(ackRules: AckRules, currentTemplateVersion: number) {
  const assets = useSyncExternalStore(subscribeAssets, getAssetsSnapshot)
  const [acknowledgements, setAcknowledgements] = useState<Acknowledgement[]>(seedAcknowledgements)
  const [workflowTasks, setWorkflowTasks] = useState<WorkflowTask[]>(seedWorkflowTasks)

  /** Tenant-unique tag validation (ASM-18). */
  const isTagTaken = useCallback(
    (tag: string, company: string, excludeId?: string) =>
      assets.some(
        (a) =>
          a.id !== excludeId &&
          a.company === company &&
          a.assetTag.toLowerCase() === tag.trim().toLowerCase()
      ),
    [assets]
  )

  const registerAsset = useCallback(
    (draft: AssetDraft, company: string): boolean => {
      if (isTagTaken(draft.assetTag, company)) {
        toast.error(`Asset ID “${draft.assetTag}” already exists in ${company} — duplicates are rejected`)
        return false
      }
      const asset: Asset = {
        ...draft,
        id: `a-${crypto.randomUUID().slice(0, 8)}`,
        company,
        state: 'Available',
        holderId: null,
        issueDate: null,
        expectedReturnDate: null,
        assignmentOrigin: null,
        history: [historyEntry('Registered', null, 'Available', null, todayIso(), null, 'Created with default state Available')],
      }
      mutateAssets((prev) => [asset, ...prev])
      auditAsset('Asset registered', asset, [
        { field: 'State', previousValue: null, newValue: 'Available' },
      ], 'create')
      toast.success(`${draft.assetTag} registered — Available for issue`)
      return true
    },
    [isTagTaken]
  )

  const updateAsset = useCallback(
    (id: string, draft: AssetDraft): boolean => {
      const asset = assets.find((a) => a.id === id)
      if (!asset) return false
      if (isTagTaken(draft.assetTag, asset.company, id)) {
        toast.error(`Asset ID “${draft.assetTag}” already exists in ${asset.company}`)
        return false
      }
      mutateAssets((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                ...draft,
                history: [
                  ...a.history,
                  historyEntry('Details edited', a.state, a.state, null, todayIso(), null, 'Master attributes updated — prior values retained in history'),
                ],
              }
            : a
        )
      )
      auditAsset('Asset details edited', { assetTag: draft.assetTag, name: draft.name }, [
        { field: 'Master attributes', previousValue: `${asset.assetTag} · ${asset.name}`, newValue: `${draft.assetTag} · ${draft.name}` },
      ], 'update')
      toast.success(`${draft.assetTag} updated`)
      return true
    },
    [assets, isTagTaken]
  )

  const raiseAck = useCallback(
    (asset: Asset, employeeId: string, type: AckType) => {
      const ack: Acknowledgement = {
        id: `ack-${crypto.randomUUID().slice(0, 8)}`,
        assetId: asset.id,
        assetLabel: `${asset.assetTag} · ${asset.name}`,
        employeeId,
        employeeName: employeeName(employeeId),
        type,
        status: 'Pending',
        raisedOn: todayIso(),
        completedOn: null,
        recordedBy: null,
        onBehalf: false,
        templateVersion: currentTemplateVersion,
        responses: [],
      }
      setAcknowledgements((prev) => [ack, ...prev])
    },
    [currentTemplateVersion]
  )

  /** Marks the linked workflow step when an issue/recovery transaction posts (ASM-25). */
  const reflectInWorkflow = useCallback(
    (action: AssetAction, employeeId: string | null, txnLabel: string) => {
      if (!employeeId) return
      const workflow = action === 'issue' || action === 'loan' ? 'Onboarding' : action === 'recover' ? 'Exit' : null
      if (!workflow) return
      setWorkflowTasks((prev) =>
        prev.map((t) =>
          t.employeeId === employeeId && t.workflow === workflow && t.status !== 'Completed'
            ? { ...t, status: 'Completed', linkedTxn: txnLabel }
            : t
        )
      )
    },
    []
  )

  /**
   * Runs a lifecycle transaction. The decision table is evaluated first —
   * invalid transitions are denied with the blocking reason (ASM-23).
   */
  const runTransaction = useCallback(
    (assetId: string, action: AssetAction, opts: TransactionOptions): boolean => {
      const asset = assets.find((a) => a.id === assetId)
      if (!asset) return false
      const rule = findRule(action, asset.state)
      if (!rule) {
        toast.error(denialReason(action, asset.state))
        return false
      }
      const movesToEmployee = action === 'issue' || action === 'loan' || action === 'transfer'
      const releasesEmployee = action === 'return' || action === 'recover'
      const employee = movesToEmployee ? employeeName(opts.employeeId ?? null) : asset.holderId ? employeeName(asset.holderId) : null
      const label = ACTION_LABELS[action]
      const priorHolderId = asset.holderId
      // Internal transfers are always tagged with their workflow origin (W5);
      // other callers (onboarding issuance, exit recovery) pass theirs in.
      const origin: AssignmentOrigin | null =
        opts.origin ?? (action === 'transfer' ? 'Internal transfer (W5)' : null)

      mutateAssets((prev) =>
        prev.map((a) => {
          if (a.id !== assetId) return a
          // A lost report keeps the accountable holder on record and stamps
          // the disciplinary/recovery routing note.
          const note =
            action === 'mark-lost'
              ? [opts.note, LOST_ROUTING_NOTE].filter(Boolean).join(' — ')
              : (opts.note ?? '')
          // Transfers record both sides of the movement in history.
          const entries: AssetHistoryEntry[] =
            action === 'transfer' && priorHolderId
              ? [
                  historyEntry(
                    'Transferred out',
                    a.state,
                    rule.to,
                    employeeName(priorHolderId),
                    opts.effectiveDate,
                    rule.id,
                    `Handed over on internal transfer — new holder ${employee}${opts.note ? `. ${opts.note}` : ''}`,
                    origin
                  ),
                  historyEntry(
                    'Transferred in',
                    rule.to,
                    rule.to,
                    employee,
                    opts.effectiveDate,
                    rule.id,
                    `Received from ${employeeName(priorHolderId)} — assignment moved without a return/reissue cycle`,
                    origin
                  ),
                ]
              : [historyEntry(label, a.state, rule.to, employee, opts.effectiveDate, rule.id, note, origin)]
          return {
            ...a,
            state: rule.to,
            holderId: movesToEmployee ? (opts.employeeId ?? null) : releasesEmployee ? null : a.holderId,
            issueDate: movesToEmployee ? opts.effectiveDate : releasesEmployee ? null : a.issueDate,
            expectedReturnDate: movesToEmployee
              ? (opts.expectedReturnDate ?? null)
              : releasesEmployee
                ? null
                : a.expectedReturnDate,
            assignmentOrigin: movesToEmployee
              ? origin
              : releasesEmployee
                ? null
                : (a.assignmentOrigin ?? null),
            history: [...a.history, ...entries],
          }
        })
      )

      if (movesToEmployee && opts.employeeId && ackRules.receiptAckRequired) {
        raiseAck(asset, opts.employeeId, 'Receipt')
      }
      if (releasesEmployee && priorHolderId && ackRules.returnAckRequired) {
        raiseAck(asset, priorHolderId, 'Return')
      }
      reflectInWorkflow(action, movesToEmployee ? (opts.employeeId ?? null) : priorHolderId, `${label} ${asset.assetTag} · ${opts.effectiveDate}`)

      auditAsset(label, asset, [
        { field: 'State', previousValue: asset.state, newValue: rule.to },
        ...(action === 'transfer' && priorHolderId
          ? [{ field: 'Held by', previousValue: employeeName(priorHolderId), newValue: employee }]
          : movesToEmployee
            ? [{ field: 'Held by', previousValue: priorHolderId ? employeeName(priorHolderId) : null, newValue: employee }]
            : releasesEmployee && priorHolderId
              ? [{ field: 'Held by', previousValue: employeeName(priorHolderId), newValue: null }]
              : []),
        ...(origin ? [{ field: 'Workflow origin', previousValue: null, newValue: origin }] : []),
        ...(action === 'mark-lost'
          ? [{ field: 'Routing', previousValue: null, newValue: LOST_ROUTING_NOTE }]
          : []),
      ])

      if (action === 'mark-lost') {
        toast.warning(
          `${asset.assetTag} reported lost — ${LOST_ROUTING_NOTE.toLowerCase()}`
        )
      } else {
        toast.success(`${asset.assetTag}: ${label} recorded (rule ${rule.id}) — state → ${rule.to}`)
      }
      return true
    },
    [assets, ackRules, raiseAck, reflectInWorkflow]
  )

  /** Captures a digital acknowledgement + condition assessment (ASM-07/08/14/24). */
  const completeAcknowledgement = useCallback(
    (ackId: string, responses: AckResponse[], recordedBy: string, onBehalf: boolean) => {
      const ack = acknowledgements.find((k) => k.id === ackId)
      setAcknowledgements((prev) =>
        prev.map((k) =>
          k.id === ackId
            ? { ...k, status: 'Completed', completedOn: todayIso(), recordedBy, onBehalf, responses }
            : k
        )
      )
      if (ack) {
        mutateAssets((prev) =>
          prev.map((a) =>
            a.id === ack.assetId
              ? {
                  ...a,
                  history: [
                    ...a.history,
                    historyEntry(
                      `${ack.type} acknowledged${onBehalf ? ' (on behalf)' : ''}`,
                      a.state,
                      a.state,
                      ack.employeeName,
                      todayIso(),
                      null,
                      `Condition captured against template v${ack.templateVersion}`
                    ),
                  ],
                }
              : a
          )
        )
        publishAuditEvent({
          module: 'Asset Management',
          action: `${ack.type} acknowledgement captured${onBehalf ? ' (on behalf)' : ''}`,
          actor: recordedBy,
          actorRole: onBehalf ? 'Company Admin' : 'Employee (User)',
          actionType: 'update',
          recordId: ack.assetLabel,
          recordName: ack.assetLabel,
          changes: [
            { field: 'Acknowledgement', previousValue: 'Pending', newValue: 'Completed' },
          ],
        })
      }
      toast.success(
        onBehalf
          ? `Acknowledgement recorded on behalf of ${ack?.employeeName ?? 'employee'} by ${recordedBy}`
          : 'Acknowledgement captured — condition assessment stored against the asset'
      )
    },
    [acknowledgements]
  )

  /** Admits approved arrival units into inventory as Available (ASM-33). */
  const admitArrival = useCallback((arrival: ArrivalRecord, company: string) => {
    const startIndex = assets.length + 1
    const units: Asset[] = Array.from({ length: arrival.approvedQuantity }, (_, i) => ({
      id: `a-${crypto.randomUUID().slice(0, 8)}`,
      assetTag: `${arrival.assetTagPrefix}-${String(startIndex + i).padStart(4, '0')}`,
      serial: `SN-${arrival.invoiceNumber}-${i + 1}`,
      name: arrival.name,
      category: arrival.category,
      vendor: arrival.vendor,
      poDate: arrival.procuredDate,
      warrantyMonths: 24,
      value: Math.round(arrival.totalValue / arrival.approvedQuantity),
      company,
      state: 'Available',
      holderId: null,
      issueDate: null,
      expectedReturnDate: null,
      assignmentOrigin: null,
      history: [
        historyEntry('Registered', null, 'Available', null, todayIso(), null, `Admitted from approved arrival ${arrival.invoiceNumber}`),
      ],
    }))
    mutateAssets((prev) => [...units, ...prev])
    publishAuditEvent({
      module: 'Asset Management',
      action: 'Arrival admitted to inventory',
      actor: CURRENT_ADMIN,
      actorRole: 'Company Admin',
      actionType: 'create',
      recordId: arrival.invoiceNumber,
      recordName: `${arrival.name} × ${arrival.approvedQuantity}`,
      changes: [
        { field: 'Units admitted', previousValue: null, newValue: String(arrival.approvedQuantity) },
      ],
    })
    toast.success(`${arrival.approvedQuantity} unit(s) of ${arrival.name} admitted to inventory as Available`)
  }, [assets.length])

  return {
    assets,
    acknowledgements,
    workflowTasks,
    isTagTaken,
    registerAsset,
    updateAsset,
    runTransaction,
    completeAcknowledgement,
    admitArrival,
  }
}

export type AssetsStore = ReturnType<typeof useAssets>
