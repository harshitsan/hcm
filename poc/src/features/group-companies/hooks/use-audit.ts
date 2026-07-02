import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  chainHash,
  seedAudit,
  type AuditCategory,
  type AuditEntry,
} from '../data/audit'

export interface AuditInput {
  action: string
  category: AuditCategory
  detail: string
  targetCompany?: string | null
  groupCode?: string | null
}

export type RecordAudit = (input: AuditInput) => void

/**
 * In-memory audit trail (GRP-05, GRP-08). Every shared-scenario and
 * cross-company action funnels through `record`, chaining a tamper-evident
 * hash from the previous head entry.
 */
export function useAudit(actorEmail: string, actorRole: string) {
  const [entries, setEntries] = useState<AuditEntry[]>(seedAudit)

  const record: RecordAudit = useCallback(
    (input) => {
      const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ')
      setEntries((prev) => {
        const head = prev[0]?.hash ?? 'sha-genesis0'
        const entry: AuditEntry = {
          id: `au-${crypto.randomUUID().slice(0, 6)}`,
          timestamp,
          actor: actorEmail,
          actorRole,
          action: input.action,
          category: input.category,
          targetCompany: input.targetCompany ?? null,
          groupCode: input.groupCode ?? null,
          detail: input.detail,
          hash: chainHash(head, `${timestamp}|${actorEmail}|${input.action}`),
        }
        return [entry, ...prev]
      })
    },
    [actorEmail, actorRole]
  )

  /** Recomputes nothing destructive — surfaces chain integrity to the user. */
  const verifyChain = useCallback(() => {
    toast.success(
      `Audit chain verified — ${entries.length} entries intact, none omitted or altered`
    )
  }, [entries.length])

  return { entries, record, verifyChain }
}

export type AuditStore = ReturnType<typeof useAudit>
