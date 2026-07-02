import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  defaultAlertSettings,
  defaultAuditSettings,
  seedAttendanceRules,
  seedAuditorPanels,
  seedRecurrencePatterns,
  type AlertSettings,
  type AttendanceRule,
  type AuditRecurrencePattern,
  type AuditSettings,
  type AuditorPanel,
} from '../data/attendance-config'
import { type AppendAudit } from './use-audit-trail'

export type AttendanceRuleDraft = Omit<AttendanceRule, 'id' | 'updatedAt'>
export type RecurrenceDraft = Omit<AuditRecurrencePattern, 'id' | 'updatedAt'>
export type PanelDraft = Omit<AuditorPanel, 'id' | 'updatedAt'>

function today() {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Attendance rules engine + audit scheduling + alerts config
 * (WFE-31 … WFE-34, WFE-40, WFE-41).
 */
export function useAttendanceConfig({
  append,
  actor,
  actorRole,
}: {
  append: AppendAudit
  actor: string
  actorRole: string
}) {
  const [rules, setRules] = useState<AttendanceRule[]>(seedAttendanceRules)
  const [patterns, setPatterns] = useState<AuditRecurrencePattern[]>(
    seedRecurrencePatterns
  )
  const [auditSettings, setAuditSettings] =
    useState<AuditSettings>(defaultAuditSettings)
  const [panels, setPanels] = useState<AuditorPanel[]>(seedAuditorPanels)
  const [alerts, setAlerts] = useState<AlertSettings>(defaultAlertSettings)

  const logConfig = useCallback(
    (summary: string, detail: string, refId: string) =>
      append({
        actor,
        actorRole,
        company: 'Aurora Foods',
        category: 'config',
        summary,
        detail,
        refId,
      }),
    [append, actor, actorRole]
  )

  const saveRule = useCallback(
    (draft: AttendanceRuleDraft, existingId?: string) => {
      if (existingId) {
        setRules((prev) =>
          prev.map((r) =>
            r.id === existingId ? { ...r, ...draft, updatedAt: today() } : r
          )
        )
      } else {
        setRules((prev) => [
          { ...draft, id: `rule-${crypto.randomUUID().slice(0, 6)}`, updatedAt: today() },
          ...prev,
        ])
      }
      logConfig(
        `${existingId ? 'Updated' : 'Added'} attendance rule "${draft.name}"`,
        `Expression: ${draft.expression} · ${draft.timePeriod} · applies to ${draft.applicability}. Updated logic governs subsequent evaluations.`,
        existingId ?? 'rule-new'
      )
      toast.success(existingId ? 'Rule updated' : 'Rule added')
    },
    [logConfig]
  )

  const savePattern = useCallback(
    (draft: RecurrenceDraft, existingId?: string) => {
      if (existingId) {
        setPatterns((prev) =>
          prev.map((p) =>
            p.id === existingId ? { ...p, ...draft, updatedAt: today() } : p
          )
        )
      } else {
        setPatterns((prev) => [
          { ...draft, id: `rec-${crypto.randomUUID().slice(0, 6)}`, updatedAt: today() },
          ...prev,
        ])
      }
      logConfig(
        `${existingId ? 'Updated' : 'Added'} audit recurrence — ${draft.location} / ${draft.workArea}`,
        `${draft.pattern}. Future audit occurrences follow the updated schedule.`,
        existingId ?? 'rec-new'
      )
      toast.success(existingId ? 'Recurrence updated' : 'Recurrence added')
    },
    [logConfig]
  )

  const saveAuditSettings = useCallback(
    (next: AuditSettings) => {
      setAuditSettings(next)
      logConfig(
        'Updated attendance audit configuration',
        `Sampling: ${next.sampleMethod} · habitual violators ${next.includeHabitualViolators ? `auto-included (≥${next.minReprimands} reprimands over ${next.historyMonths} months)` : 'not auto-included'} · reschedule limit ${next.rescheduleLimit}.`,
        'audit-settings'
      )
      toast.success('Audit configuration saved')
    },
    [logConfig]
  )

  const savePanel = useCallback(
    (draft: PanelDraft, existingId?: string) => {
      if (existingId) {
        setPanels((prev) =>
          prev.map((p) =>
            p.id === existingId ? { ...p, ...draft, updatedAt: today() } : p
          )
        )
      } else {
        setPanels((prev) => [
          { ...draft, id: `pan-${crypto.randomUUID().slice(0, 6)}`, updatedAt: today() },
          ...prev,
        ])
      }
      logConfig(
        `${existingId ? 'Updated' : 'Added'} auditor panel "${draft.name}"`,
        `Location: ${draft.location} · ${draft.members.length} member(s). Subsequent audits use the updated panel.`,
        existingId ?? 'pan-new'
      )
      toast.success(existingId ? 'Auditor panel updated' : 'Auditor panel added')
    },
    [logConfig]
  )

  const saveAlerts = useCallback(
    (next: AlertSettings) => {
      setAlerts(next)
      logConfig(
        `Alerts module ${next.moduleEnabled ? 'enabled' : 'disabled'}`,
        next.moduleEnabled
          ? `Triggers — attendance not recorded: ${next.attendanceNotRecorded ? 'on' : 'off'}, announcements: ${next.announcements ? 'on' : 'off'}, pending tasks: ${next.pendingTask ? 'on' : 'off'}, overdue tasks: ${next.overdueTask ? 'on' : 'off'}.`
          : 'No alerts will be generated while disabled.',
        'alerts'
      )
      toast.success('Alert settings saved')
    },
    [logConfig]
  )

  return {
    rules,
    patterns,
    auditSettings,
    panels,
    alerts,
    saveRule,
    savePattern,
    saveAuditSettings,
    savePanel,
    saveAlerts,
  }
}

export type AttendanceConfigStore = ReturnType<typeof useAttendanceConfig>
