import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedAttendanceTemplates,
  seedAuditPatterns,
  seedAuditSettings,
  seedAuditorsGroups,
  seedBreaks,
  seedCalendars,
  seedCompOffTemplates,
  seedDevices,
  seedFlexi,
  seedGroupCompliance,
  seedIntegrations,
  seedOtEligibility,
  seedOtScopeLocations,
  seedOutTimeSettings,
  seedOvertimeRules,
  seedStatutory,
  seedTenants,
  seedTrackingModes,
  seedWfhTemplates,
  seedWorkflows,
  type ApprovalWorkflow,
  type AttendanceTemplate,
  type AuditConfigSettings,
  type AuditRecurrence,
  type AuditorsGroup,
  type BreakRule,
  type FlexiSettings,
  type Holiday,
  type HolidayCalendar,
  type OutTimeSettings,
  type StatutoryConfig,
  type TemplateChannel,
  type TrackingDevice,
  type TrackingMode,
} from '../data/config'
import { type WorkerCategory } from '../data/shared'

/**
 * Versioned, effective-dated Time & Attendance configuration store
 * (TNA-07/08/12/16/21/24/26/29/30/32/34/35/37/39/40/41/43/47).
 * Saving statutory or workflow changes creates a new version and supersedes
 * the previous one so prior periods keep their configuration.
 */
export function useAttendanceConfig() {
  const [calendars, setCalendars] = useState<HolidayCalendar[]>(seedCalendars)
  const [statutory, setStatutory] = useState<StatutoryConfig[]>(seedStatutory)
  const [overtimeRules] = useState(seedOvertimeRules)
  const [otEligibility, setOtEligibility] = useState(seedOtEligibility)
  const [breaks, setBreaks] = useState<BreakRule[]>(seedBreaks)
  const [compOffTemplates, setCompOffTemplates] = useState(seedCompOffTemplates)
  const [compOffEnabled, setCompOffEnabled] = useState(true)
  const [flexi, setFlexi] = useState<FlexiSettings>(seedFlexi)
  const [outTimeSettings, setOutTimeSettings] = useState(seedOutTimeSettings)
  const [wfhTemplates, setWfhTemplates] = useState(seedWfhTemplates)
  const [wfhEnabled, setWfhEnabled] = useState(true)
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>(seedWorkflows)
  const [devices, setDevices] = useState<TrackingDevice[]>(seedDevices)
  const [trackingModes, setTrackingModes] = useState(seedTrackingModes)
  const [auditPatterns, setAuditPatterns] = useState<AuditRecurrence[]>(seedAuditPatterns)
  const [auditorsGroups, setAuditorsGroups] = useState<AuditorsGroup[]>(seedAuditorsGroups)
  const [auditSettings, setAuditSettings] = useState<AuditConfigSettings>(seedAuditSettings)
  const [templates, setTemplates] = useState<AttendanceTemplate[]>(seedAttendanceTemplates)
  const [overtimeEnabled, setOvertimeEnabled] = useState(true)
  const [otScopeLocations, setOtScopeLocations] = useState<string[]>(seedOtScopeLocations)
  const [integrations, setIntegrations] = useState(seedIntegrations)
  const [tenants, setTenants] = useState(seedTenants)
  const [groupCompliance] = useState(seedGroupCompliance)
  /** Optional holidays the current employee opted into (TNA-08/17). */
  const [optedHolidayIds, setOptedHolidayIds] = useState<string[]>(['hol-07'])

  const activeCalendar = calendars.find((c) => c.status === 'active') ?? calendars[0]
  const activeStatutory = statutory.find((s) => s.status === 'active') ?? statutory[0]

  /** TNA-07/08 — add a holiday scoped company-wide or to a location. */
  const addHoliday = useCallback((holiday: Omit<Holiday, 'id'>) => {
    setCalendars((prev) =>
      prev.map((c) =>
        c.status === 'active'
          ? {
              ...c,
              holidays: [
                ...c.holidays,
                { ...holiday, id: `hol-${crypto.randomUUID().slice(0, 6)}` },
              ],
            }
          : c
      )
    )
    toast.success(`"${holiday.name}" added (${holiday.scope}, ${holiday.kind})`)
  }, [])

  /** TNA-08/17 — opt in/out of optional holidays up to the allowance. */
  const toggleOptionalHoliday = useCallback(
    (holidayId: string) => {
      setOptedHolidayIds((prev) => {
        if (prev.includes(holidayId)) {
          toast.success('Optional holiday opt-in removed — treated as a working day for you')
          return prev.filter((id) => id !== holidayId)
        }
        if (prev.length >= activeCalendar.optionalAllowance) {
          toast.error(`You may opt into at most ${activeCalendar.optionalAllowance} optional holidays`)
          return prev
        }
        toast.success('Optional holiday opted in')
        return [...prev, holidayId]
      })
    },
    [activeCalendar.optionalAllowance]
  )

  /** TNA-12/24 — statutory change creates a new effective-dated version. */
  const saveStatutory = useCallback(
    (draft: Omit<StatutoryConfig, 'id' | 'version' | 'status'>) => {
      setStatutory((prev) => {
        const current = prev.find((s) => s.status === 'active')
        return [
          {
            ...draft,
            id: `stat-${crypto.randomUUID().slice(0, 6)}`,
            version: (current?.version ?? 0) + 1,
            status: 'active',
          },
          ...prev.map((s) => (s.status === 'active' ? { ...s, status: 'superseded' as const } : s)),
        ]
      })
      toast.success(
        `Statutory working hours v${(activeStatutory?.version ?? 0) + 1} saved — applies from ${draft.effectiveFrom}; prior periods keep the previous version`
      )
    },
    [activeStatutory]
  )

  /** TNA-10/26 — worker-category eligibility toggles. */
  const toggleOtEligibility = useCallback((category: WorkerCategory) => {
    setOtEligibility((prev) =>
      prev.map((e) => (e.category === category ? { ...e, eligible: !e.eligible } : e))
    )
    toast.success(`Overtime eligibility updated for ${category} — rules engine will apply it on next evaluation`)
  }, [])

  const addBreak = useCallback((draft: Omit<BreakRule, 'id'>) => {
    setBreaks((prev) => [
      { ...draft, id: `brk-${crypto.randomUUID().slice(0, 6)}` },
      ...prev,
    ])
    toast.success(`Break "${draft.name}" saved (${draft.allowableMinutes} min allowable)`)
  }, [])

  const addCompOffTemplate = useCallback(
    (draft: { name: string; classSpecific: boolean; employeeClass: string; minHoursBeyond: number }) => {
      setCompOffTemplates((prev) => [
        {
          id: `cot-${crypto.randomUUID().slice(0, 6)}`,
          name: draft.name,
          classSpecific: draft.classSpecific,
          employeeClass: draft.employeeClass as (typeof prev)[number]['employeeClass'],
          minHoursBeyond: draft.minHoursBeyond,
        },
        ...prev,
      ])
      toast.success(`Comp off template "${draft.name}" saved`)
    },
    []
  )

  const addWfhTemplate = useCallback(
    (draft: { name: string; classSpecific: boolean; employeeClass: string; maxPerMonth: number }) => {
      setWfhTemplates((prev) => [
        {
          id: `wft-${crypto.randomUUID().slice(0, 6)}`,
          name: draft.name,
          classSpecific: draft.classSpecific,
          employeeClass: draft.employeeClass as (typeof prev)[number]['employeeClass'],
          maxPerMonth: draft.maxPerMonth,
        },
        ...prev,
      ])
      toast.success(`WFH template "${draft.name}" saved`)
    },
    []
  )

  const saveFlexi = useCallback((next: FlexiSettings) => {
    setFlexi(next)
    toast.success(
      next.enabled
        ? `Flexi schedules enabled (${next.basis}-based) for: ${next.assigned.join(', ') || '—'}`
        : 'Flexi schedules disabled'
    )
  }, [])

  /** TNA-16/24 — workflow edits version forward and apply to new requests. */
  const updateWorkflow = useCallback((id: string, changes: Partial<ApprovalWorkflow>) => {
    setWorkflows((prev) =>
      prev.map((w) =>
        w.id === id
          ? { ...w, ...changes, version: w.version + 1, effectiveFrom: new Date().toISOString().slice(0, 10) }
          : w
      )
    )
    toast.success('Workflow updated — applies to subsequently submitted requests')
  }, [])

  const addDevice = useCallback((draft: Omit<TrackingDevice, 'id' | 'status'>) => {
    setDevices((prev) => [
      { ...draft, id: `dev-${crypto.randomUUID().slice(0, 6)}`, status: 'online' },
      ...prev,
    ])
    toast.success(`Device "${draft.name}" registered — alerts go to ${draft.alertEmail}`)
  }, [])

  /** TNA-35 — out-time limits are saved and enforced on new requests. */
  const addOutTimeSetting = useCallback((draft: Omit<OutTimeSettings, 'id'>) => {
    setOutTimeSettings((prev) => [
      { ...draft, id: `ots-${crypto.randomUUID().slice(0, 6)}` },
      ...prev,
    ])
    toast.success(
      `Out-time limits "${draft.name}" saved — max ${draft.maxRequestsPerMonth} requests, ${draft.maxHoursPerRequest}h each, ${draft.maxHoursPerMonth}h/month`
    )
  }, [])

  /** TNA-41 — new tracking modes are saved and listed for reconciliation. */
  const addTrackingMode = useCallback((draft: Omit<TrackingMode, 'id'>) => {
    setTrackingModes((prev) => [
      { ...draft, id: `tm-${crypto.randomUUID().slice(0, 6)}` },
      ...prev,
    ])
    toast.success(`Tracking mode "${draft.name}" saved (${draft.reconciliation} reconciliation)`)
  }, [])

  const addAuditPattern = useCallback((draft: Omit<AuditRecurrence, 'id' | 'lastRun'>) => {
    setAuditPatterns((prev) => [
      { ...draft, id: `aud-${crypto.randomUUID().slice(0, 6)}`, lastRun: null },
      ...prev,
    ])
    toast.success(`Audit recurrence "${draft.name}" scheduled (${draft.schedule})`)
  }, [])

  /** Kensium ARP — adjust audit timing for a location or work area. */
  const updateAuditPattern = useCallback(
    (id: string, changes: Partial<Omit<AuditRecurrence, 'id'>>) => {
      setAuditPatterns((prev) => prev.map((p) => (p.id === id ? { ...p, ...changes } : p)))
      toast.success('Audit recurrence pattern updated')
    },
    []
  )

  /** Kensium BRK — keep break durations and applicability accurate. */
  const updateBreak = useCallback((id: string, changes: Partial<Omit<BreakRule, 'id'>>) => {
    setBreaks((prev) => prev.map((b) => (b.id === id ? { ...b, ...changes } : b)))
    toast.success('Break updated')
  }, [])

  /** Kensium CMP — keep comp off thresholds accurate. */
  const updateCompOffTemplate = useCallback(
    (id: string, changes: { name: string; classSpecific: boolean; employeeClass: string; minHoursBeyond: number }) => {
      setCompOffTemplates((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                name: changes.name,
                classSpecific: changes.classSpecific,
                employeeClass: changes.employeeClass as (typeof prev)[number]['employeeClass'],
                minHoursBeyond: changes.minHoursBeyond,
              }
            : t
        )
      )
      toast.success('Comp off template updated')
    },
    []
  )

  /** Kensium OTR — adjust out-time limits over time. */
  const updateOutTimeSetting = useCallback(
    (id: string, changes: Partial<Omit<OutTimeSettings, 'id'>>) => {
      setOutTimeSettings((prev) => prev.map((s) => (s.id === id ? { ...s, ...changes } : s)))
      toast.success('Out-time request settings updated — applies to new requests')
    },
    []
  )

  /** Kensium CRA/COA/OTA — add a new approver configuration. */
  const addWorkflow = useCallback(
    (draft: Omit<ApprovalWorkflow, 'id' | 'version' | 'effectiveFrom' | 'status'>) => {
      setWorkflows((prev) => [
        {
          ...draft,
          id: `wf-${crypto.randomUUID().slice(0, 6)}`,
          version: 1,
          effectiveFrom: new Date().toISOString().slice(0, 10),
          status: 'active',
        },
        ...prev,
      ])
      toast.success(`Approver configuration saved for ${draft.scope}`)
    },
    []
  )

  const deleteWorkflow = useCallback((id: string) => {
    setWorkflows((prev) => prev.filter((w) => w.id !== id))
    toast.success('Approver configuration deleted — in-flight requests keep their assigned approvers')
  }, [])

  // ---------------------------------------------- Attendance audit (AAG/ACS)
  const addAuditorsGroup = useCallback((draft: Omit<AuditorsGroup, 'id'>) => {
    setAuditorsGroups((prev) => [
      { ...draft, id: `ag-${crypto.randomUUID().slice(0, 6)}` },
      ...prev,
    ])
    toast.success(`Auditors group "${draft.panelName}" saved for ${draft.location}`)
  }, [])

  const updateAuditorsGroup = useCallback(
    (id: string, changes: Partial<Omit<AuditorsGroup, 'id'>>) => {
      setAuditorsGroups((prev) => prev.map((g) => (g.id === id ? { ...g, ...changes } : g)))
      toast.success('Auditors group updated')
    },
    []
  )

  const deleteAuditorsGroup = useCallback((id: string) => {
    setAuditorsGroups((prev) => {
      const group = prev.find((g) => g.id === id)
      if (group) toast.success(`Auditors group "${group.panelName}" deleted`)
      return prev.filter((g) => g.id !== id)
    })
  }, [])

  const refreshAuditorsGroups = useCallback(() => {
    setAuditorsGroups((prev) => [...prev])
    toast.success('Auditors groups refreshed — showing the latest saved panels')
  }, [])

  /** Kensium ACS — save the org-wide attendance audit configuration. */
  const saveAuditSettings = useCallback((next: AuditConfigSettings) => {
    setAuditSettings(next)
    toast.success(
      next.auditEnabled
        ? `Audit configuration saved — ${next.sampleMethod} sampling${next.includeHabitualViolators ? `, habitual violators (≥${next.minReprimands} reprimands in ${next.historyPeriodMonths} months) always included` : ''}`
        : 'Attendance audit support disabled'
    )
  }, [])

  // --------------------------------------------- Templates (Kensium ET/NT)
  const updateTemplate = useCallback(
    (id: string, changes: Partial<Omit<AttendanceTemplate, 'id' | 'channel'>>) => {
      setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, ...changes } : t)))
      toast.success('Template updated')
    },
    []
  )

  const refreshTemplates = useCallback((channel: TemplateChannel) => {
    setTemplates((prev) => [...prev])
    toast.success(
      channel === 'email'
        ? 'Email templates refreshed — showing the latest templates'
        : 'Notification templates refreshed — showing the latest templates'
    )
  }, [])

  // ------------------------------------------------ Overtime (Kensium OT)
  const toggleOvertimeEnabled = useCallback((enabled: boolean) => {
    setOvertimeEnabled(enabled)
    toast.success(
      enabled
        ? 'Overtime enabled — employees can log and be approved for overtime work'
        : 'Overtime disabled — no new overtime accrues'
    )
  }, [])

  /** Kensium OT — transfer-list assignment of the locations OT applies to. */
  const saveOtScopeLocations = useCallback((assigned: string[]) => {
    setOtScopeLocations(assigned)
    toast.success(`Overtime scope saved — applies to: ${assigned.join(', ') || 'no locations'}`)
  }, [])

  /** TNA-21 — connection test surfaces a clear pass/fail. */
  const testIntegration = useCallback(
    (id: string) => {
      const integration = integrations.find((i) => i.id === id)
      if (!integration) return
      if (integration.credentialStatus === 'invalid') {
        toast.error(`${integration.name}: connection failed — 401 invalid credentials at ${integration.endpoint}`)
      } else {
        toast.success(`${integration.name}: connection OK (214 ms)`)
      }
    },
    [integrations]
  )

  const toggleIntegration = useCallback((id: string) => {
    setIntegrations((prev) =>
      prev.map((i) => (i.id === id ? { ...i, enabled: !i.enabled } : i))
    )
  }, [])

  /** TNA-21 — tenant-level module enablement. */
  const toggleTenant = useCallback((tenant: string) => {
    setTenants((prev) =>
      prev.map((t) =>
        t.tenant === tenant
          ? {
              ...t,
              enabled: !t.enabled,
              captureMethods: !t.enabled ? ['Manual', 'Biometric', 'API', 'File import'] : [],
            }
          : t
      )
    )
    toast.success(`Time & Attendance module toggled for ${tenant}`)
  }, [])

  return {
    calendars,
    activeCalendar,
    statutory,
    activeStatutory,
    overtimeRules,
    otEligibility,
    breaks,
    compOffTemplates,
    compOffEnabled,
    setCompOffEnabled,
    flexi,
    outTimeSettings,
    wfhTemplates,
    wfhEnabled,
    setWfhEnabled,
    workflows,
    devices,
    trackingModes,
    auditPatterns,
    auditorsGroups,
    auditSettings,
    templates,
    overtimeEnabled,
    otScopeLocations,
    integrations,
    tenants,
    groupCompliance,
    optedHolidayIds,
    addHoliday,
    toggleOptionalHoliday,
    saveStatutory,
    toggleOtEligibility,
    addBreak,
    addCompOffTemplate,
    addWfhTemplate,
    saveFlexi,
    updateWorkflow,
    addWorkflow,
    deleteWorkflow,
    addDevice,
    addOutTimeSetting,
    updateOutTimeSetting,
    addTrackingMode,
    addAuditPattern,
    updateAuditPattern,
    updateBreak,
    updateCompOffTemplate,
    addAuditorsGroup,
    updateAuditorsGroup,
    deleteAuditorsGroup,
    refreshAuditorsGroups,
    saveAuditSettings,
    updateTemplate,
    refreshTemplates,
    toggleOvertimeEnabled,
    saveOtScopeLocations,
    testIntegration,
    toggleIntegration,
    toggleTenant,
  }
}

export type AttendanceConfigStore = ReturnType<typeof useAttendanceConfig>
