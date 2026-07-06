import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedInitiations,
  seedRatings,
  type ReviewInitiation,
  type ReviewRating,
} from '../data/performance-review'
import { type LogInput } from './use-lifecycle-log'

interface Deps {
  log: (input: Omit<LogInput, 'actor' | 'actorRole'>) => void
}

/** Sections exposing an explicit refresh affordance. */
export type PerformanceSection = 'initiations' | 'ratings'

const COMPANY = 'Aurora Software India'
const MODULE = 'Performance Review'

/**
 * Performance Review store — module setup (enable / disable) plus the review
 * initiation and employee rating grids. All state is in-memory.
 */
export function usePerformanceReview({ log }: Deps) {
  const [moduleEnabled, setModuleEnabled] = useState(true)
  const [initiations, setInitiations] =
    useState<ReviewInitiation[]>(seedInitiations)
  const [ratings, setRatings] = useState<ReviewRating[]>(seedRatings)
  const [refreshedAt, setRefreshedAt] = useState<
    Partial<Record<PerformanceSection, string>>
  >({})

  /** Simulated re-fetch: stamps the section and confirms via toast. */
  const refresh = useCallback(
    (section: PerformanceSection, label: string) => {
      setRefreshedAt((prev) => ({
        ...prev,
        [section]: new Date().toLocaleTimeString(),
      }))
      toast.success(`${label} refreshed — showing the latest data`)
    },
    []
  )

  /** Setup save (PRS-01 enable / PRS-02 disable / PRS-03 save & next). */
  const saveSetup = useCallback(
    (enabled: boolean) => {
      setModuleEnabled(enabled)
      log({
        company: COMPANY,
        module: MODULE,
        action: `Performance Review module ${enabled ? 'enabled' : 'disabled'}`,
        target: 'Performance Review setup',
        outcome: enabled
          ? 'Employees and managers can participate in performance reviews'
          : 'Performance reviews are turned off for this company',
        onBehalfOf: null,
      })
      toast.success(
        `Setup saved — Performance Review module ${enabled ? 'enabled' : 'disabled'}`
      )
    },
    [log]
  )

  /** Kick off a pending review cycle from the initiation grid. */
  const initiateCycle = useCallback(
    (cycle: ReviewInitiation) => {
      setInitiations((prev) =>
        prev.map((c) =>
          c.id === cycle.id
            ? { ...c, status: 'Initiated', task: 'Collect self-assessments' }
            : c
        )
      )
      log({
        company: COMPANY,
        module: MODULE,
        action: 'Review cycle initiated',
        target: `${cycle.id} · ${cycle.reviewPeriodFrom} → ${cycle.reviewPeriodTo}`,
        outcome: 'Self-assessment tasks pushed to the team',
        onBehalfOf: null,
      })
      toast.success('Review cycle initiated — team notified')
    },
    [log]
  )

  /** Submit the manager rating for a pending record. */
  const submitRating = useCallback(
    (record: ReviewRating, rating: number) => {
      setRatings((prev) =>
        prev.map((r) =>
          r.id === record.id
            ? { ...r, rating, status: 'Closed', task: 'None — rating published' }
            : r
        )
      )
      log({
        company: COMPANY,
        module: MODULE,
        action: 'Manager rating submitted',
        target: `${record.id} · ${record.employeeName}`,
        outcome: `Rating ${rating}/5 recorded for ${record.reviewPeriodFrom} → ${record.reviewPeriodTo}`,
        onBehalfOf: null,
      })
      toast.success(`Rating ${rating}/5 submitted for ${record.employeeName}`)
    },
    [log]
  )

  return {
    moduleEnabled,
    saveSetup,
    initiations,
    initiateCycle,
    ratings,
    submitRating,
    refresh,
    refreshedAt,
  }
}

export type PerformanceReviewStore = ReturnType<typeof usePerformanceReview>
