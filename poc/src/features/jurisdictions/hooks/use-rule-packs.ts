import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedRulePacks,
  type JurisdictionRulePack,
} from '../data/rule-packs'

const today = () => new Date().toISOString().slice(0, 10)

/**
 * In-memory store for versioned, effective-dated jurisdiction rule-packs
 * (JUR-13). Publishing supersedes the prior version and takes effect for the
 * engines immediately — no code deployment.
 */
export function useRulePacks() {
  const [packs, setPacks] = useState<JurisdictionRulePack[]>(seedRulePacks)

  const publishVersion = useCallback(
    (packId: string, effectiveFrom: string, changeNote: string) => {
      setPacks((prev) => {
        const base = prev.find((p) => p.id === packId)
        if (!base) return prev
        const maxVersion = prev
          .filter((p) => p.packKey === base.packKey)
          .reduce((max, p) => Math.max(max, p.version), 0)
        const next: JurisdictionRulePack = {
          ...base,
          id: `rp-${crypto.randomUUID().slice(0, 8)}`,
          version: maxVersion + 1,
          status: 'published',
          effectiveFrom,
          publishedBy: 'You (Platform Admin)',
          publishedAt: today(),
          changeNote,
        }
        // Prior published versions are retained as superseded so the change
        // remains auditable and revertible (JUR-13).
        return [
          next,
          ...prev.map((p) =>
            p.packKey === base.packKey && p.status === 'published'
              ? { ...p, status: 'superseded' as const }
              : p
          ),
        ]
      })
      toast.success(
        'New rule-pack version published — engines pick it up by effective date, no code deployment'
      )
    },
    []
  )

  /** Revert = republish the superseded version's content as the newest one. */
  const revertToVersion = useCallback(
    (packId: string) => {
      const target = packs.find((p) => p.id === packId)
      if (!target) return
      publishVersion(
        packId,
        today(),
        `Reverted to the v${target.version} rule set.`
      )
    },
    [packs, publishVersion]
  )

  return { packs, publishVersion, revertToVersion }
}

export type RulePacksStore = ReturnType<typeof useRulePacks>
