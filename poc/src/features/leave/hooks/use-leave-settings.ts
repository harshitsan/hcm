import { useState } from 'react'
import { toast } from 'sonner'
import {
  seedAdjustmentApprovers,
  seedCalendarAccess,
  seedClassRules,
  seedClosures,
  seedFmlaApprovers,
  seedFmlaReasons,
  seedPlatformDefaults,
  seedTemplates,
  seedTenants,
  seedTimeOffApprovers,
  type ApproverMapping,
  type CalendarAccessConfig,
  type EmployeeClassRule,
  type FmlaReason,
  type NotificationTemplate,
  type OfficeClosure,
  type PlatformDefaults,
  type Tenant,
} from '../data/config'
import {
  MAX_OPTIONAL_HOLIDAYS,
  seedHolidayCalendars,
  seedOptionalRequests,
  type HolidayCalendar,
  type OptionalHolidayRequest,
} from '../data/holidays'
import { seedCatalog, type CatalogEntry } from '../data/leave-types'
import { seedShifts, type ShiftDefinition } from '../data/shifts'
import {
  CURRENT_EMPLOYEE_ID,
  employeeById,
  shortId,
} from '../data/shared'

interface Deps {
  notify: (event: string, recipients: string, message: string) => void
}

/**
 * Location-based approver mappings, FMLA reasons, holiday calendars,
 * optional-holiday choices, closures, class rules, templates, module setup
 * and platform-level settings (LVE-20/22/33/37..48).
 */
export function useLeaveSettings({ notify }: Deps) {
  const [shifts, setShifts] = useState<ShiftDefinition[]>(seedShifts)
  const [timeOffApprovers, setTimeOffApprovers] = useState<ApproverMapping[]>(
    seedTimeOffApprovers
  )
  const [adjustmentApprovers, setAdjustmentApprovers] = useState<
    ApproverMapping[]
  >(seedAdjustmentApprovers)
  const [fmlaApprovers, setFmlaApprovers] =
    useState<ApproverMapping[]>(seedFmlaApprovers)
  const [fmlaReasons, setFmlaReasons] = useState<FmlaReason[]>(seedFmlaReasons)
  const [classRules, setClassRules] =
    useState<EmployeeClassRule[]>(seedClassRules)
  const [closures, setClosures] = useState<OfficeClosure[]>(seedClosures)
  const [templates, setTemplates] =
    useState<NotificationTemplate[]>(seedTemplates)
  const [calendars, setCalendars] = useState<HolidayCalendar[]>(
    seedHolidayCalendars
  )
  const [optionalRequests, setOptionalRequests] = useState<
    OptionalHolidayRequest[]
  >(seedOptionalRequests)
  const [moduleEnabled, setModuleEnabled] = useState(true)
  const [calendarModuleEnabled, setCalendarModuleEnabledState] = useState(true)
  const [calendarAccess, setCalendarAccess] =
    useState<CalendarAccessConfig>(seedCalendarAccess)
  const [platformDefaults, setPlatformDefaults] = useState<PlatformDefaults>(
    seedPlatformDefaults
  )
  const [catalog, setCatalog] = useState<CatalogEntry[]>(seedCatalog)
  const [tenants] = useState<Tenant[]>(seedTenants)
  const [deniedAccessLog, setDeniedAccessLog] = useState<string[]>([
    '2026-06-14 03:12 UTC — tenant tn-2 query attempted to read tn-1 leave_requests → DENIED by RLS policy, logged.',
  ])

  /**
   * Shift master (Kensium Shift section). Flexi shifts never carry a
   * tolerance limit, and at most one shift may be the default.
   */
  const normalizeShift = (draft: Omit<ShiftDefinition, 'id'>) => ({
    ...draft,
    toleranceMinutes: draft.flexiHours ? null : draft.toleranceMinutes,
  })

  const addShift = (draft: Omit<ShiftDefinition, 'id'>) => {
    const shift = { ...normalizeShift(draft), id: shortId('shf') }
    setShifts((prev) => [
      ...(shift.defaultShift
        ? prev.map((s) => ({ ...s, defaultShift: false }))
        : prev),
      shift,
    ])
    toast.success(`Shift "${draft.name}" saved`)
  }

  const updateShift = (id: string, draft: Omit<ShiftDefinition, 'id'>) => {
    const next = normalizeShift(draft)
    setShifts((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...next, id }
          : next.defaultShift
            ? { ...s, defaultShift: false }
            : s
      )
    )
    toast.success(`Shift "${draft.name}" updated`)
  }

  const removeShift = (id: string) => {
    const target = shifts.find((s) => s.id === id)
    setShifts((prev) => prev.filter((s) => s.id !== id))
    toast.success(
      target?.defaultShift
        ? 'Default shift removed — mark another shift as default so unassigned employees are covered'
        : 'Shift removed'
    )
  }

  /** Mark one shift as default; the previous default is unset. */
  const setDefaultShift = (id: string) => {
    setShifts((prev) => prev.map((s) => ({ ...s, defaultShift: s.id === id })))
    toast.success(
      'Default shift updated — assigned to employees with no shift assignment'
    )
  }

  const addMapping = (
    kind: 'timeoff' | 'adjustment' | 'fmla',
    draft: Omit<ApproverMapping, 'id'>
  ) => {
    const mapping = { ...draft, id: shortId(kind) }
    if (kind === 'timeoff') setTimeOffApprovers((prev) => [...prev, mapping])
    if (kind === 'adjustment')
      setAdjustmentApprovers((prev) => [...prev, mapping])
    if (kind === 'fmla') setFmlaApprovers((prev) => [...prev, mapping])
    toast.success('Approver mapping saved')
  }

  /** TOAP-04 / TOAA-03: edit an existing approver mapping in place. */
  const updateMapping = (
    kind: 'timeoff' | 'adjustment' | 'fmla',
    id: string,
    draft: Omit<ApproverMapping, 'id'>
  ) => {
    const apply = (prev: ApproverMapping[]) =>
      prev.map((m) => (m.id === id ? { ...draft, id } : m))
    if (kind === 'timeoff') setTimeOffApprovers(apply)
    if (kind === 'adjustment') setAdjustmentApprovers(apply)
    if (kind === 'fmla') setFmlaApprovers(apply)
    toast.success('Approver mapping updated — new routing applies to future requests')
  }

  const removeMapping = (kind: 'timeoff' | 'adjustment' | 'fmla', id: string) => {
    if (kind === 'timeoff')
      setTimeOffApprovers((prev) => prev.filter((m) => m.id !== id))
    if (kind === 'adjustment')
      setAdjustmentApprovers((prev) => prev.filter((m) => m.id !== id))
    if (kind === 'fmla')
      setFmlaApprovers((prev) => prev.filter((m) => m.id !== id))
    toast.success('Mapping removed')
  }

  const addFmlaReason = (draft: Omit<FmlaReason, 'id'>) => {
    setFmlaReasons((prev) => [...prev, { ...draft, id: shortId('fr') }])
    toast.success(`FMLA ${draft.kind} reason added`)
  }

  /** FMQR/FMRR: delete a configured FMLA reason. */
  const removeFmlaReason = (id: string) => {
    setFmlaReasons((prev) => prev.filter((r) => r.id !== id))
    toast.success('FMLA reason removed')
  }

  const updateClassRule = (id: string, patch: Partial<EmployeeClassRule>) => {
    setClassRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
    )
    toast.success('Employee class rules updated — applied to accruals and approvals')
  }

  const addClosure = (
    draft: Omit<OfficeClosure, 'id' | 'details' | 'notifyEmails' | 'duration'> &
      Partial<Pick<OfficeClosure, 'details' | 'notifyEmails' | 'duration'>>
  ) => {
    const closure: OfficeClosure = {
      details: '',
      notifyEmails: [],
      duration: 'full-day',
      ...draft,
      id: shortId('oc'),
    }
    setClosures((prev) => [closure, ...prev])
    notify(
      'Adjusted',
      closure.notifyEmails.length
        ? closure.notifyEmails.join(', ')
        : 'Employees in scoped locations/departments',
      `Office closure scheduled: ${draft.reason} (${draft.from} – ${draft.to}, ${closure.duration}). Dates treated as non-working; no leave deducted.`
    )
    toast.success('Office closure scheduled — closed dates will not consume leave')
  }

  const updateTemplate = (id: string, subject: string, body: string) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, subject, body } : t))
    )
    toast.success('Template saved — used for the next matching event, no code changes')
  }

  const addCalendar = (
    draft: Omit<
      HolidayCalendar,
      'id' | 'status' | 'shiftIds' | 'notifyEmployees'
    > &
      Partial<Pick<HolidayCalendar, 'shiftIds' | 'notifyEmployees'>>
  ) => {
    setCalendars((prev) => [
      {
        shiftIds: [],
        notifyEmployees: false,
        ...draft,
        id: shortId('hc'),
        status: 'draft',
      },
      ...prev,
    ])
    toast.success('Holiday calendar created (draft)')
  }

  /** HOLCAL-04: edit an existing calendar — details, holidays and status. */
  const updateCalendar = (
    id: string,
    patch: Partial<Omit<HolidayCalendar, 'id'>>
  ) => {
    setCalendars((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
    )
    toast.success('Holiday calendar updated')
  }

  const publishCalendar = (id: string) => {
    setCalendars((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'published' } : c))
    )
    toast.success('Calendar published — visible on the employee Holiday List')
  }

  /** LVE-33: confirm an optional holiday, limited by policy. */
  const confirmOptionalHoliday = (holidayName: string, date: string, day: string) => {
    const mine = optionalRequests.filter(
      (r) => r.employeeId === CURRENT_EMPLOYEE_ID && r.status !== 'rejected'
    )
    if (mine.length >= MAX_OPTIONAL_HOLIDAYS) {
      toast.error(
        `You have already confirmed ${MAX_OPTIONAL_HOLIDAYS} optional holidays — the policy maximum`
      )
      return
    }
    if (mine.some((r) => r.holidayName === holidayName)) {
      toast.error('This optional holiday is already confirmed')
      return
    }
    const me = employeeById(CURRENT_EMPLOYEE_ID)
    setOptionalRequests((prev) => [
      {
        id: shortId('ohr'),
        employeeId: CURRENT_EMPLOYEE_ID,
        employeeName: me?.name ?? 'Me',
        employeeClass: me?.employeeClass ?? 'Regular',
        holidayName,
        date,
        day,
        status: 'pending',
        employeeActive: true,
      },
      ...prev,
    ])
    notify(
      'Submitted',
      'Reporting manager (approver)',
      `Optional holiday confirmation: ${me?.name} chose ${holidayName} (${date}).`
    )
    toast.success(`${holidayName} confirmed — sent to your manager for approval`)
  }

  /** LVE-33: swap a confirmed optional holiday with its exchange option. */
  const swapOptionalHoliday = (id: string, swapWith: string) => {
    setOptionalRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, holidayName: swapWith, status: 'pending' } : r
      )
    )
    toast.success(`Swapped to ${swapWith} — re-sent for approval`)
  }

  /** LVE-46: manager decision on an optional-holiday request. */
  const decideOptionalRequest = (id: string, approve: boolean) => {
    const req = optionalRequests.find((r) => r.id === id)
    setOptionalRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: approve ? 'approved' : 'rejected' } : r
      )
    )
    if (req)
      notify(
        approve ? 'Approved' : 'Rejected',
        `${req.employeeName} (applicant)`,
        `Optional holiday ${req.holidayName} (${req.date}) ${approve ? 'approved' : 'declined'}.`
      )
    toast.success(approve ? 'Optional holiday approved' : 'Optional holiday rejected')
  }

  /** CAL-01/02 (Setup): enable or disable the calendar module. */
  const setCalendarModuleEnabled = (enabled: boolean) => {
    setCalendarModuleEnabledState(enabled)
    toast.success(
      enabled
        ? 'Calendar module enabled — calendar features are now available to the organization'
        : 'Calendar module disabled — calendar features are switched off'
    )
  }

  /** CAL-05 (Configure Calendar): persist the accessibility configuration. */
  const saveCalendarAccess = (next: CalendarAccessConfig) => {
    setCalendarAccess(next)
    notify(
      'Adjusted',
      'All employees',
      'Calendar accessibility updated — peer calendars ' +
        `${next.peerCalendars ? 'enabled' : 'disabled'}, manager hierarchy ` +
        `${next.managerHierarchy ? 'enabled' : 'disabled'}, HR visibility ` +
        `${next.hrVisibility ? 'enabled' : 'disabled'}, event announcements ` +
        `${next.eventAnnouncements ? 'shown' : 'hidden'}.`
    )
    toast.success('Calendar accessibility configuration saved')
  }

  const toggleCatalogEntry = (id: string) => {
    setCatalog((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, enabledForTenants: !c.enabledForTenants } : c
      )
    )
    toast.success('Master catalog updated — tenants inherit the change')
  }

  const setDefaults = (patch: Partial<PlatformDefaults>) => {
    setPlatformDefaults((prev) => ({ ...prev, ...patch }))
    toast.success('Global defaults saved — new tenants inherit these values')
  }

  /** LVE-22: simulated cross-tenant probe, always denied and logged. */
  const probeCrossTenant = (fromTenant: string, toTenant: string) => {
    setDeniedAccessLog((prev) => [
      `${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC — tenant ${fromTenant} query attempted to read ${toTenant} leave_requests → DENIED by RLS policy, logged.`,
      ...prev,
    ])
    toast.error('Cross-tenant access denied by row-level security — attempt logged')
  }

  return {
    shifts,
    timeOffApprovers,
    adjustmentApprovers,
    fmlaApprovers,
    fmlaReasons,
    classRules,
    closures,
    templates,
    calendars,
    optionalRequests,
    moduleEnabled,
    calendarModuleEnabled,
    calendarAccess,
    platformDefaults,
    catalog,
    tenants,
    deniedAccessLog,
    addShift,
    updateShift,
    removeShift,
    setDefaultShift,
    addMapping,
    updateMapping,
    removeMapping,
    addFmlaReason,
    removeFmlaReason,
    updateClassRule,
    addClosure,
    updateTemplate,
    addCalendar,
    updateCalendar,
    publishCalendar,
    confirmOptionalHoliday,
    swapOptionalHoliday,
    decideOptionalRequest,
    setModuleEnabled,
    setCalendarModuleEnabled,
    saveCalendarAccess,
    toggleCatalogEntry,
    setDefaults,
    probeCrossTenant,
  }
}

export type LeaveSettingsStore = ReturnType<typeof useLeaveSettings>
