import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  defaultPasswordPolicy,
  seedAuditRecords,
  type AuditRecord,
  type PasswordPolicy,
} from '../data/security'

/**
 * In-memory security & compliance store (SYS-14, 32, 52). Immutable audit
 * trail (append-only) and the platform-wide password/security policy.
 */
export function useSecurity() {
  const [auditRecords, setAuditRecords] =
    useState<AuditRecord[]>(seedAuditRecords)
  const [policy, setPolicy] = useState<PasswordPolicy>(defaultPasswordPolicy)

  /** Audit records can only be appended — never altered or deleted (SYS-32). */
  const appendAudit = useCallback(
    (record: Omit<AuditRecord, 'id' | 'at'>) => {
      setAuditRecords((prev) => [
        {
          ...record,
          id: `aud-${crypto.randomUUID().slice(0, 8)}`,
          at: new Date().toISOString().slice(0, 16).replace('T', ' '),
        },
        ...prev,
      ])
    },
    []
  )

  /** Demonstrates tenant-boundary enforcement + denial logging (SYS-52). */
  const simulateCrossTenantRead = useCallback(() => {
    appendAudit({
      tenantCode: 'ASTER-IN',
      actor: 'you',
      event: 'Cross-tenant read denied',
      kind: 'denial',
      context: 'target: MERIDIAN employee record — tenant boundary enforced',
    })
    toast.error(
      'Denied — tenant boundaries are enforced before any data is returned. A denial audit record was logged.'
    )
  }, [appendAudit])

  /** Platform-wide password & security rules (SYS-14). */
  const updatePolicy = useCallback(
    (next: PasswordPolicy) => {
      setPolicy(next)
      appendAudit({
        tenantCode: 'PLATFORM',
        actor: 'you',
        event: 'Password policy updated',
        kind: 'security',
        context: `minLength: ${next.minLength}, expiry: ${next.expiryDays}d, MFA: ${next.mfaRequired ? 'on' : 'off'}`,
      })
      toast.success('Security policy saved — the updated rules apply platform-wide')
    },
    [appendAudit]
  )

  return { auditRecords, policy, appendAudit, simulateCrossTenantRead, updatePolicy }
}

export type SecurityStore = ReturnType<typeof useSecurity>
