import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  backupTiers,
  failoverPosture,
  recoveryObjectives,
  seedAvailabilityTiers,
  seedDrTests,
  seedMaintenanceWindows,
  seedPerfMetrics,
  type DrTest,
  type MaintenanceWindow,
} from '../data/operations'

export interface MaintenanceDraft {
  date: string
  durationHours: number
}

/**
 * In-memory operations & SLA store (SYS-23, 24, 53-64). Static SLA posture
 * plus interactive DR test log and maintenance-window scheduling.
 */
export function useOperations() {
  const [drTests, setDrTests] = useState<DrTest[]>(seedDrTests)
  const [maintenanceWindows, setMaintenanceWindows] = useState<
    MaintenanceWindow[]
  >(seedMaintenanceWindows)

  const perfMetrics = seedPerfMetrics
  const availabilityTiers = seedAvailabilityTiers

  const recordDrTest = useCallback((kind: DrTest['kind']) => {
    setDrTests((prev) =>
      prev.map((t) =>
        t.kind === kind
          ? { ...t, lastRun: new Date().toISOString().slice(0, 10), result: 'passed' }
          : t
      )
    )
    toast.success(`${kind} recorded — recovery procedure validated`)
  }, [])

  /**
   * Sunday 2:00–6:00 AM IST, ≤ 4 h, at most once per month, 7-day notice
   * (SYS-61). Returns an error string when the draft violates the policy.
   */
  const scheduleMaintenance = useCallback(
    (draft: MaintenanceDraft): string | null => {
      const date = new Date(`${draft.date}T00:00:00`)
      if (date.getDay() !== 0)
        return 'Maintenance windows must fall on a Sunday'
      if (draft.durationHours > 4)
        return 'Maintenance is limited to 4 hours (02:00–06:00 IST)'
      const noticeDays = Math.floor(
        (date.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
      )
      if (noticeDays < 7)
        return 'Customers need at least 7 days advance notice'
      const month = draft.date.slice(0, 7)
      if (maintenanceWindows.some((w) => w.date.slice(0, 7) === month))
        return 'Only one maintenance window is allowed per month'

      const end = 2 + draft.durationHours
      setMaintenanceWindows((prev) => [
        ...prev,
        {
          id: `mw-${crypto.randomUUID().slice(0, 8)}`,
          date: draft.date,
          window: `Sun 02:00–0${end}:00 IST`,
          durationHours: draft.durationHours,
          noticeSentOn: new Date().toISOString().slice(0, 10),
          status: 'announced',
        },
      ])
      toast.success('Maintenance scheduled — 7-day advance notice sent to all tenants')
      return null
    },
    [maintenanceWindows]
  )

  return {
    perfMetrics,
    availabilityTiers,
    recoveryObjectives,
    backupTiers,
    failoverPosture,
    drTests,
    maintenanceWindows,
    recordDrTest,
    scheduleMaintenance,
  }
}

export type OperationsStore = ReturnType<typeof useOperations>
