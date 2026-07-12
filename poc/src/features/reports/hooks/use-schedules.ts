import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  computeNextRun,
  seedDeliveries,
  seedSchedules,
  type DeliveryLogEntry,
  type ReportSchedule,
} from '../data/schedules'

export type ScheduleDraft = Omit<
  ReportSchedule,
  'id' | 'lastRun' | 'nextRun' | 'status'
>

/**
 * In-memory scheduled-delivery store (RPT-09) plus the Notification/Template
 * engine delivery log it writes to (RPT-24).
 */
export function useSchedules() {
  const [schedules, setSchedules] = useState<ReportSchedule[]>(seedSchedules)
  const [deliveries, setDeliveries] =
    useState<DeliveryLogEntry[]>(seedDeliveries)

  const addSchedule = useCallback((draft: ScheduleDraft) => {
    const schedule: ReportSchedule = {
      ...draft,
      id: `sch-${crypto.randomUUID().slice(0, 8)}`,
      status: 'active',
      lastRun: '—',
      nextRun: computeNextRun(draft.frequency, draft.time),
    }
    setSchedules((prev) => [schedule, ...prev])
    toast.success(
      `${draft.reportName} scheduled ${draft.frequency.toLowerCase()} at ${draft.time}`
    )
    return schedule
  }, [])

  const updateSchedule = useCallback((id: string, draft: ScheduleDraft) => {
    setSchedules((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              ...draft,
              nextRun:
                s.status === 'active'
                  ? computeNextRun(draft.frequency, draft.time)
                  : s.nextRun,
            }
          : s
      )
    )
    toast.success('Schedule updated — future deliveries follow the new setup')
  }, [])

  const togglePause = (id: string) => {
    const target = schedules.find((s) => s.id === id)
    if (!target || target.status === 'cancelled') return
    const paused = target.status === 'active'
    setSchedules((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              status: paused ? 'paused' : 'active',
              nextRun: paused ? '—' : computeNextRun(s.frequency, s.time),
            }
          : s
      )
    )
    toast.success(paused ? 'Schedule paused' : 'Schedule resumed')
  }

  const cancelSchedule = useCallback((id: string) => {
    setSchedules((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, status: 'cancelled', nextRun: '—' } : s
      )
    )
    toast.success('Schedule cancelled — no further deliveries will be sent')
  }, [])

  /** Simulate the engine generating + emailing the report now (RPT-24). */
  const runNow = useCallback((schedule: ReportSchedule) => {
    const entry: DeliveryLogEntry = {
      id: `dl-${crypto.randomUUID().slice(0, 8)}`,
      reportName: schedule.reportName,
      ranAt: '2026-07-02 (on demand)',
      outcome: 'delivered',
      attempts: 1,
      detail: `Generated within scope “${schedule.scope}” · emailed to ${schedule.recipients.length} recipient(s) as ${schedule.format}`,
    }
    setDeliveries((prev) => [entry, ...prev])
    setSchedules((prev) =>
      prev.map((s) =>
        s.id === schedule.id ? { ...s, lastRun: '2026-07-02 (on demand)' } : s
      )
    )
    toast.success(
      `${schedule.reportName} generated and emailed to ${schedule.recipients.length} recipient(s)`
    )
  }, [])

  /** Engine retry for a failed delivery (RPT-24). */
  const retryDelivery = useCallback((id: string) => {
    setDeliveries((prev) =>
      prev.map((d) =>
        d.id === id && d.outcome === 'failed'
          ? {
              ...d,
              outcome: 'retried-delivered',
              attempts: d.attempts + 1,
              detail: `${d.detail} · manual engine retry succeeded`,
            }
          : d
      )
    )
    toast.success('Engine retry succeeded — outcome recorded in the log')
  }, [])

  return {
    schedules,
    deliveries,
    addSchedule,
    updateSchedule,
    togglePause,
    cancelSchedule,
    runNow,
    retryDelivery,
  }
}

export type SchedulesStore = ReturnType<typeof useSchedules>
