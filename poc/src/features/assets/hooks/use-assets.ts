import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedAcknowledgements,
  seedWorkflowTasks,
  type Acknowledgement,
  type AckResponse,
  type AckType,
  type WorkflowTask,
} from '../data/acknowledgements'
import {
  ACTION_LABELS,
  seedAssets,
  type Asset,
  type AssetAction,
  type AssetHistoryEntry,
  type AssetState,
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
}

function historyEntry(
  event: string,
  priorState: AssetState | null,
  newState: AssetState,
  employee: string | null,
  effectiveDate: string,
  ruleId: string | null,
  note = ''
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
    note,
  }
}

/**
 * In-memory canonical asset store: master records, lifecycle transactions
 * validated against the rules-engine decision table (ASM-23), append-only
 * bitemporal history (ASM-17), acknowledgements (ASM-07/08/14) and the
 * workflow-engine asset tasks (ASM-09/25).
 */
export function useAssets(ackRules: AckRules, currentTemplateVersion: number) {
  const [assets, setAssets] = useState<Asset[]>(seedAssets)
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
        history: [historyEntry('Registered', null, 'Available', null, todayIso(), null, 'Created with default state Available')],
      }
      setAssets((prev) => [asset, ...prev])
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
      setAssets((prev) =>
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

      setAssets((prev) =>
        prev.map((a) => {
          if (a.id !== assetId) return a
          const note =
            action === 'transfer' && priorHolderId
              ? `Transferred from ${employeeName(priorHolderId)} to ${employee}. ${opts.note ?? ''}`.trim()
              : (opts.note ?? '')
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
            history: [
              ...a.history,
              historyEntry(label, a.state, rule.to, employee, opts.effectiveDate, rule.id, note),
            ],
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

      toast.success(`${asset.assetTag}: ${label} recorded (rule ${rule.id}) — state → ${rule.to}`)
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
        setAssets((prev) =>
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
      history: [
        historyEntry('Registered', null, 'Available', null, todayIso(), null, `Admitted from approved arrival ${arrival.invoiceNumber}`),
      ],
    }))
    setAssets((prev) => [...units, ...prev])
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
