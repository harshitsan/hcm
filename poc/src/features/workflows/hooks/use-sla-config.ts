import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedCalendars,
  seedSlaPolicies,
  type BusinessCalendar,
  type SlaPolicy,
} from '../data/sla'
import { type AppendAudit } from './use-audit-trail'

export interface CalendarDraft {
  name: string
  workingDays: string
  workingHours: string
  holidays: string[]
}

export interface SlaPolicyDraft {
  name: string
  durationHours: number
  calendarId: string
  effectiveFrom: string
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Business-hour calendars + SLA rule-packs as versioned, effective-dated
 * config (WFE-09, WFE-10, WFE-24). Updates bump the version; in-flight
 * timers keep their bound config.
 */
export function useSlaConfig({
  append,
  actor,
  actorRole,
}: {
  append: AppendAudit
  actor: string
  actorRole: string
}) {
  const [calendars, setCalendars] = useState<BusinessCalendar[]>(seedCalendars)
  const [policies, setPolicies] = useState<SlaPolicy[]>(seedSlaPolicies)

  const saveCalendar = useCallback(
    (draft: CalendarDraft, existingId?: string) => {
      if (existingId) {
        setCalendars((prev) =>
          prev.map((c) =>
            c.id === existingId
              ? {
                  ...c,
                  ...draft,
                  version: c.version + 1,
                  effectiveFrom: today(),
                  updatedBy: actor,
                }
              : c
          )
        )
      } else {
        setCalendars((prev) => [
          {
            ...draft,
            id: `cal-${crypto.randomUUID().slice(0, 6)}`,
            version: 1,
            effectiveFrom: today(),
            status: 'active',
            updatedBy: actor,
          },
          ...prev,
        ])
      }
      append({
        actor,
        actorRole,
        company: 'Aurora Foods',
        category: 'config',
        summary: existingId
          ? `Republished calendar "${draft.name}" (new version)`
          : `Created business-hour calendar "${draft.name}"`,
        detail: `${draft.workingDays}, ${draft.workingHours}; ${draft.holidays.length} holiday(s). In-flight timers keep their bound version.`,
        refId: existingId ?? 'cal-new',
      })
      toast.success(existingId ? 'Calendar republished' : 'Calendar created')
    },
    [append, actor, actorRole]
  )

  const savePolicy = useCallback(
    (draft: SlaPolicyDraft, existingId?: string) => {
      if (existingId) {
        setPolicies((prev) =>
          prev.map((p) =>
            p.id === existingId
              ? {
                  ...p,
                  name: draft.name,
                  durationHours: draft.durationHours,
                  calendarId: draft.calendarId,
                  effectiveFrom: draft.effectiveFrom,
                  version: p.version + 1,
                  updatedBy: actor,
                }
              : p
          )
        )
      } else {
        setPolicies((prev) => [
          {
            id: `sla-${crypto.randomUUID().slice(0, 6)}`,
            name: draft.name,
            durationHours: draft.durationHours,
            reminderThresholds: [50, 75],
            escalateAtPercent: 100,
            calendarId: draft.calendarId,
            version: 1,
            effectiveFrom: draft.effectiveFrom,
            status: 'active',
            updatedBy: actor,
          },
          ...prev,
        ])
      }
      append({
        actor,
        actorRole,
        company: 'Aurora Foods',
        category: 'config',
        summary: existingId
          ? `Updated SLA rule-pack "${draft.name}"`
          : `Created SLA rule-pack "${draft.name}"`,
        detail: `${draft.durationHours} business hours · reminders at 50%/75% · escalation at 100% · effective ${draft.effectiveFrom}.`,
        refId: existingId ?? 'sla-new',
      })
      toast.success(existingId ? 'SLA rule-pack updated' : 'SLA rule-pack created')
    },
    [append, actor, actorRole]
  )

  return { calendars, policies, saveCalendar, savePolicy }
}

export type SlaConfigStore = ReturnType<typeof useSlaConfig>
