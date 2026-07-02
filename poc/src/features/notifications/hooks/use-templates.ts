import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedTemplates,
  type BRAND_COLORS,
  type NotificationTemplate,
} from '../data/templates'

export interface TemplateDraft {
  subject: string
  body: string
  brandColor: (typeof BRAND_COLORS)[number]
  includeLogo: boolean
  note: string
}

/**
 * In-memory template library store (FR 6.27.4). Every save appends a new
 * effective-dated version — history is retained for audit (NTF-20) and the
 * seeded original stays restorable (NTF-25).
 */
export function useTemplates() {
  const [templates, setTemplates] =
    useState<NotificationTemplate[]>(seedTemplates)

  const saveTemplate = useCallback((id: string, draft: TemplateDraft) => {
    const today = new Date().toISOString().slice(0, 10)
    setTemplates((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t
        const next = {
          version: t.versions.length + 1,
          subject: draft.subject,
          body: draft.body,
          brandColor: draft.brandColor,
          includeLogo: draft.includeLogo,
          effectiveFrom: today,
          updatedBy: 'You',
          note: draft.note || 'Updated via template editor',
        }
        return { ...t, customized: true, versions: [...t.versions, next] }
      })
    )
    toast.success(
      `Template ${id} saved as a new version effective ${today}. New notifications use the latest version; history is retained.`
    )
  }, [])

  /** Restores the seeded original as a new version (original never deleted). */
  const restoreDefault = useCallback((id: string) => {
    const today = new Date().toISOString().slice(0, 10)
    setTemplates((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t
        const original = t.versions[0]
        const restored = {
          ...original,
          version: t.versions.length + 1,
          effectiveFrom: today,
          updatedBy: 'You',
          note: 'Restored seeded default',
        }
        return { ...t, customized: false, versions: [...t.versions, restored] }
      })
    )
    toast.success(`Template ${id} restored to its seeded default.`)
  }, [])

  /** Company-level override of a group/portfolio template (NTF-15, NTF-16). */
  const overrideAtCompany = useCallback((id: string) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, level: 'Company' } : t))
    )
    toast.success(
      `Template ${id} now has a company-level override — it takes precedence over the group/portfolio default for this company.`
    )
  }, [])

  return { templates, saveTemplate, restoreDefault, overrideAtCompany }
}
