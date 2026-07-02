import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  seedAnnouncements,
  seedMyDocuments,
  seedPanels,
  seedRecentlyViewed,
  seedSearchRecords,
  seedSelfProfile,
  type InterviewPanel,
  type SearchRecord,
  type SelfProfile,
} from '../data/workspace'

/**
 * In-memory employee workspace store (SYS-18, 19, 27, 72, 73). Tenant-aware
 * global search with custom fields, recently viewed records, the
 * self-service snapshot and interview panel participation.
 */
export function useWorkspace() {
  const [query, setQuery] = useState('')
  const [recentlyViewed, setRecentlyViewed] =
    useState<SearchRecord[]>(seedRecentlyViewed)
  const [profile, setProfile] = useState<SelfProfile>(seedSelfProfile)
  const [panels, setPanels] = useState<InterviewPanel[]>(seedPanels)

  const announcements = seedAnnouncements
  const documents = seedMyDocuments

  /** Employees, Candidates & Document names + custom fields (SYS-72, 73). */
  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return seedSearchRecords
      .map((r) => {
        const matchedField = Object.entries(r.customFields).find(
          ([k, v]) =>
            k.toLowerCase().includes(q) || v.toLowerCase().includes(q)
        )
        const direct =
          r.title.toLowerCase().includes(q) ||
          r.subtitle.toLowerCase().includes(q)
        return direct || matchedField
          ? { record: r, viaCustomField: !direct && matchedField ? matchedField[0] : null }
          : null
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
  }, [query])

  /** Keeps the default 10 most recent records (SYS-73). */
  const viewRecord = useCallback((record: SearchRecord) => {
    setRecentlyViewed((prev) =>
      [record, ...prev.filter((r) => r.id !== record.id)].slice(0, 10)
    )
    toast.info(`Opened ${record.title} (added to recently viewed)`)
  }, [])

  const updateProfile = useCallback((next: SelfProfile) => {
    setProfile(next)
    toast.success('Profile updated')
  }, [])

  const submitLeave = useCallback((type: string, from: string, to: string) => {
    toast.success(`${type} leave submitted for ${from} → ${to} — routed to your manager`)
  }, [])

  const blockedTransaction = useCallback((action: string) => {
    toast.error(`${action} is blocked by policy for your access level`)
  }, [])

  /** Panel feedback moves the interview to completed (SYS-19). */
  const submitFeedback = useCallback((id: string, rating: string) => {
    setPanels((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'completed' } : p))
    )
    toast.success(`Feedback submitted (${rating}) — visible to the hiring team`)
  }, [])

  return {
    query,
    setQuery,
    results,
    recentlyViewed,
    profile,
    panels,
    announcements,
    documents,
    viewRecord,
    updateProfile,
    submitLeave,
    blockedTransaction,
    submitFeedback,
  }
}

export type WorkspaceStore = ReturnType<typeof useWorkspace>
