import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { publishAuditEvent } from '@/features/audit-logs/data/live-trail'
import { consumeNextEmployeeCode, getEmployeeCodeSeries } from '../data/configuration'
import { applyMappedValue, type MappedImportInput } from '../data/mass-mapping'
import {
  companyName,
  EMPLOYEES_TODAY,
  getGovernmentIds,
  MASS_FUNCTION_LABELS,
  normalizeGovernmentId,
  seedDelegations,
  seedEmployees,
  seedManagerChanges,
  type Delegation,
  type Dependant,
  type Employee,
  type LifeEvent,
  type LifecycleStage,
  type ManagerChange,
  type MassFunction,
} from '../data/employees'

export type EmployeeDraft = Omit<
  Employee,
  | 'id'
  | 'code'
  | 'leaveBalances'
  | 'dependants'
  | 'lifeEvents'
  | 'lifecycleEvents'
  | 'evaluatedRulePack'
  | 'esiPfEligibility'
  | 'maternityEligibility'
  | 'gratuityEligibility'
  | 'suspension'
  | 'roleTransferNote'
> & {
  /** Manual employee code — used only when auto-generation is off. */
  code?: string
}

/**
 * Mass-update field-grid labels that map onto a core Employee attribute —
 * these patch the record directly; unmapped labels land on `bulkFieldValues`.
 */
const MASS_FIELD_PATCHES: Record<string, (value: string) => Partial<Employee>> =
  {
    'Work email': (value) => ({ email: value }),
    Department: (value) => ({ departments: [value] }),
    Position: (value) => ({ position: value }),
    'Position level': (value) => ({ positionLevel: value }),
    'Reporting manager': (value) => ({ primaryManager: value }),
    'Functional manager': (value) => ({ dottedLineManagers: [value] }),
  }

export type DedupField = 'Aadhaar' | 'PAN' | 'Passport'

/** Government-ID match surfaced by the dedup check. */
export interface DedupMatch {
  field: DedupField
  existingName: string
  existingCode: string
  /** Company of the matching record, e.g. 'Aurora Retail Pvt Ltd'. */
  company: string
}

export type DedupClassification =
  | { kind: 'clear' }
  | ({ kind: 'same-company' } & DedupMatch)
  | ({ kind: 'separate-company' } & DedupMatch)

/**
 * In-memory employees store — company-scoped records, manager change audit
 * trail, acting-manager delegations and self-service sub-records. Mirrors the
 * users store pattern; state resets on reload (no backend in the POC).
 */
export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>(seedEmployees)
  const [managerChanges, setManagerChanges] =
    useState<ManagerChange[]>(seedManagerChanges)
  const [delegations, setDelegations] = useState<Delegation[]>(seedDelegations)

  /**
   * Rules-engine stand-in for duplicate detection (EMP-10 / EMP-25): a
   * same-company government-ID collision blocks the save; the same person in
   * another company is a valid separate record per the governed dedup config.
   */
  const classifyGovernmentIds = useCallback(
    (
      draft: Pick<EmployeeDraft, 'aadhar' | 'pan' | 'passport' | 'companyId'>,
      excludeId?: string
    ): DedupClassification => {
      const checks: Array<[DedupField, string]> = [
        ['Aadhaar', normalizeGovernmentId(draft.aadhar)],
        ['PAN', normalizeGovernmentId(draft.pan)],
        ['Passport', normalizeGovernmentId(draft.passport)],
      ]
      for (const [field, value] of checks) {
        if (!value) continue
        const hit = employees.find((e) => {
          if (e.id === excludeId) return false
          const ids = getGovernmentIds(e)
          return (
            (field === 'Aadhaar' &&
              normalizeGovernmentId(ids.aadhaar) === value) ||
            (field === 'PAN' && normalizeGovernmentId(ids.pan) === value) ||
            (field === 'Passport' &&
              normalizeGovernmentId(ids.passport) === value)
          )
        })
        if (!hit) continue
        return {
          kind:
            hit.companyId === draft.companyId
              ? 'same-company'
              : 'separate-company',
          field,
          existingName: hit.name,
          existingCode: hit.code,
          company: companyName(hit.companyId),
        }
      }
      return { kind: 'clear' }
    },
    [employees]
  )

  const addEmployee = useCallback((draft: EmployeeDraft) => {
    // Code derives from the configured generation series (Employee
    // Configuration → Codes & Self-Service); manual entry when it is off.
    const series = getEmployeeCodeSeries()
    const code = series.autoGenerate
      ? consumeNextEmployeeCode()
      : draft.code?.trim() || `NEW-${String(Math.floor(1000 + Math.random() * 9000))}`
    const employee: Employee = {
      ...draft,
      id: `e-${crypto.randomUUID().slice(0, 8)}`,
      code,
      suspension: null,
      roleTransferNote: null,
      esiPfEligibility: 'Pending evaluation',
      maternityEligibility: 'Pending evaluation',
      gratuityEligibility: 'Pending evaluation',
      evaluatedRulePack: '—',
      leaveBalances: [
        { type: 'Earned Leave', balance: 0, statutoryEntitlement: 18 },
        { type: 'Casual Leave', balance: 0, statutoryEntitlement: 12 },
        { type: 'Sick Leave', balance: 0, statutoryEntitlement: 12 },
      ],
      dependants: [],
      lifeEvents: [],
      lifecycleEvents: [
        {
          id: `lc-${crypto.randomUUID().slice(0, 6)}`,
          type: 'Onboarding',
          date: new Date().toISOString().slice(0, 10),
          note: 'Record created',
        },
      ],
    }
    setEmployees((prev) => [employee, ...prev])
    // Mirror into the central platform trail (worklist #26).
    publishAuditEvent({
      module: 'Employee Management',
      action: 'Employee record created',
      actor: 'You',
      actorRole: 'HR Manager',
      actionType: 'create',
      recordId: code,
      recordName: draft.name,
      changes: [
        { field: 'Record', previousValue: null, newValue: 'Created' },
        { field: 'Company', previousValue: null, newValue: companyName(draft.companyId) },
      ],
    })
    toast.success(
      `${draft.name} (${code}) added to ${companyName(draft.companyId)}`
    )
    return employee
  }, [])

  const updateEmployee = useCallback(
    (id: string, draft: Partial<Employee>) => {
      setEmployees((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...draft } : e))
      )
    },
    []
  )

  const recordManagerChange = useCallback(
    (change: Omit<ManagerChange, 'id' | 'changedOn'>) => {
      setManagerChanges((prev) => [
        {
          ...change,
          id: `mc-${crypto.randomUUID().slice(0, 6)}`,
          changedOn: new Date().toISOString().slice(0, 10),
        },
        ...prev,
      ])
    },
    []
  )

  const recordLifecycleEvent = useCallback(
    (id: string, type: LifecycleStage, note: string, date: string) => {
      const target = employees.find((e) => e.id === id)
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === id
            ? {
                ...e,
                lifecycleStage: type,
                lifecycleEvents: [
                  ...e.lifecycleEvents,
                  {
                    id: `lc-${crypto.randomUUID().slice(0, 6)}`,
                    type,
                    date,
                    note,
                  },
                ],
              }
            : e
        )
      )
      publishAuditEvent({
        module: 'Employee Management',
        action: 'Lifecycle event recorded',
        actor: 'You',
        actorRole: 'HR Manager',
        actionType: 'status-change',
        recordId: target?.code,
        recordName: target?.name,
        changes: [
          {
            field: 'Lifecycle stage',
            previousValue: target?.lifecycleStage ?? null,
            newValue: type,
          },
        ],
      })
      toast.success(`Lifecycle event recorded — stage set to ${type}`)
    },
    [employees]
  )

  /** EMP-22/23 — engine stand-in: re-evaluates eligibility & accrues leave. */
  const runEngines = useCallback((id: string) => {
    setEmployees((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e
        const pack =
          e.jurisdiction === 'India — Karnataka'
            ? 'IN-KA v3 (2026-04-01)'
            : e.jurisdiction === 'India — Maharashtra'
              ? 'IN-MH v2 (2026-01-01)'
              : 'IN-TS v1 (2025-07-01)'
        return {
          ...e,
          esiPfEligibility:
            e.esiPfEligibility === 'Pending evaluation'
              ? 'Eligible'
              : e.esiPfEligibility,
          maternityEligibility:
            e.maternityEligibility === 'Pending evaluation'
              ? 'Eligible'
              : e.maternityEligibility,
          gratuityEligibility:
            e.gratuityEligibility === 'Pending evaluation'
              ? 'Not eligible'
              : e.gratuityEligibility,
          evaluatedRulePack: pack,
          leaveBalances: e.leaveBalances.map((b) => ({
            ...b,
            balance: Math.min(b.balance + 1.5, b.statutoryEntitlement + 10),
          })),
        }
      })
    )
    toast.success(
      'Rules & accrual engines ran — eligibility and balances recomputed from the effective rule-pack'
    )
  }, [])

  const linkUserAccount = useCallback((id: string, link: boolean) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === id ? { ...e, hasUserAccount: link } : e))
    )
    toast.success(
      link
        ? 'User account linked — existing record preserved, access enabled'
        : 'User account unlinked — employee record remains intact'
    )
  }, [])

  const addDelegation = useCallback(
    (draft: Omit<Delegation, 'id' | 'status' | 'reroutedApprovals'>) => {
      const today = new Date().toISOString().slice(0, 10)
      const delegation: Delegation = {
        ...draft,
        id: `del-${crypto.randomUUID().slice(0, 6)}`,
        status: draft.startDate <= today ? 'Active' : 'Scheduled',
        reroutedApprovals: 0,
      }
      setDelegations((prev) => [delegation, ...prev])
      setManagerChanges((prev) => [
        {
          id: `mc-${crypto.randomUUID().slice(0, 6)}`,
          employeeName: draft.team,
          changeType: 'Acting',
          from: draft.manager,
          to: draft.actingManager,
          effectiveDate: draft.startDate,
          endDate: draft.endDate,
          changedBy: 'You',
          changedOn: today,
        },
        ...prev,
      ])
      toast.success(
        `Delegation set — approvals will auto-reroute to ${draft.actingManager} until ${draft.endDate}`
      )
    },
    []
  )

  const endDelegation = useCallback((id: string) => {
    setDelegations((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: 'Ended' } : d))
    )
    toast.success('Delegation ended — routing reverted to the primary manager')
  }, [])

  const addDependant = useCallback(
    (employeeId: string, dependant: Omit<Dependant, 'id'>) => {
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === employeeId
            ? {
                ...e,
                dependants: [
                  ...e.dependants,
                  { ...dependant, id: `dep-${crypto.randomUUID().slice(0, 6)}` },
                ],
              }
            : e
        )
      )
      toast.success(`${dependant.name} added as ${dependant.relationship}`)
    },
    []
  )

  const removeDependant = useCallback(
    (employeeId: string, dependantId: string) => {
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === employeeId
            ? {
                ...e,
                dependants: e.dependants.filter((d) => d.id !== dependantId),
              }
            : e
        )
      )
      toast.success('Dependant removed')
    },
    []
  )

  const addLifeEvent = useCallback(
    (employeeId: string, event: Omit<LifeEvent, 'id'>) => {
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === employeeId
            ? {
                ...e,
                lifeEvents: [
                  ...e.lifeEvents,
                  { ...event, id: `le-${crypto.randomUUID().slice(0, 6)}` },
                ],
              }
            : e
        )
      )
      toast.success(
        `${event.type} recorded — available for HR eligibility review`
      )
    },
    []
  )

  /**
   * EMP-43 — mass update across many employee records. Legacy single-value
   * functions patch the record attribute directly; the field-grid categories
   * (contact / address / agreements / skills / generalInfo / clientFeedback)
   * patch the matching core-record attribute where one exists and store the
   * remaining sub-record fields on `bulkFieldValues` (visible on the record
   * detail sheet).
   */
  const massUpdate = useCallback(
    (ids: string[], fn: MassFunction, value: string, fields?: string[]) => {
      if (fn === 'position' || fn === 'employeeClass' || fn === 'jurisdiction') {
        setEmployees((prev) =>
          prev.map((e) => (ids.includes(e.id) ? { ...e, [fn]: value } : e))
        )
        toast.success(
          `${MASS_FUNCTION_LABELS[fn]} set to “${value}” on ${ids.length} employee record(s)`
        )
        return
      }
      const selected = fields ?? []
      if (selected.length === 0) return
      setEmployees((prev) =>
        prev.map((e) => {
          if (!ids.includes(e.id)) return e
          let next: Employee = { ...e }
          const extras: Record<string, string> = {
            ...(e.bulkFieldValues ?? {}),
          }
          for (const field of selected) {
            const patch = MASS_FIELD_PATCHES[field]
            if (patch) {
              next = { ...next, ...patch(value) }
            } else {
              extras[field] = value
            }
          }
          return { ...next, bulkFieldValues: extras }
        })
      )
      toast.success(
        `${MASS_FUNCTION_LABELS[fn]} mass update applied — ${selected.length} field(s) changed on ${ids.length} employee record(s)`
      )
    },
    []
  )

  /**
   * W10 — mass update via data mapping: applies a mapped bulk file onto the
   * store. Only valid rows are written (the mapping preview flags the rest);
   * the mapping itself (source column → target field pairs) plus the
   * applied/skipped counts are mirrored into the central audit trail.
   */
  const applyMappedImport = useCallback((input: MappedImportInput) => {
    const applied = input.rows.filter((r) => r.valid && r.employeeId)
    const skipped = input.rows.length - applied.length
    setEmployees((prev) =>
      prev.map((e) => {
        const row = applied.find((r) => r.employeeId === e.id)
        if (!row) return e
        return row.assignments.reduce(
          (record, a) => applyMappedValue(record, a.targetId, a.value),
          e
        )
      })
    )
    publishAuditEvent({
      module: 'Employee Management',
      action: 'Mass update applied via data mapping',
      actor: 'You',
      actorRole: 'HR Manager',
      actionType: 'update',
      recordId: input.sourceName,
      recordName: `Bulk file import — ${input.sourceName}`,
      changes: [
        {
          field: 'Source file',
          previousValue: null,
          newValue: input.sourceName,
        },
        {
          field: 'Data mapping',
          previousValue: null,
          newValue: input.mappingPairs
            .map((p) => `${p.from} → ${p.to}`)
            .join(', '),
        },
        {
          field: 'Rows',
          previousValue: null,
          newValue: `${applied.length} applied, ${skipped} skipped`,
        },
      ],
    })
    toast.success(
      `Mass update applied from ${input.sourceName} — ${applied.length} row(s) updated, ${skipped} skipped`
    )
  }, [])

  /**
   * Admin role reassignment — transfers this employee's role assignments to
   * another employee and stamps an inline audit note on both records.
   */
  const reassignRoles = useCallback(
    (sourceId: string, targetId: string) => {
      const source = employees.find((e) => e.id === sourceId)
      const target = employees.find((e) => e.id === targetId)
      if (!source || !target) return
      setEmployees((prev) =>
        prev.map((e) => {
          if (e.id === sourceId) {
            return {
              ...e,
              roles: [],
              roleTransferNote: `Roles transferred to ${target.name} on ${EMPLOYEES_TODAY}`,
            }
          }
          if (e.id === targetId) {
            return {
              ...e,
              roles: [...new Set([...e.roles, ...source.roles])],
              roleTransferNote: `Roles received from ${source.name} on ${EMPLOYEES_TODAY}`,
            }
          }
          return e
        })
      )
      toast.success(
        `Role assignments transferred from ${source.name} to ${target.name}`
      )
    },
    [employees]
  )

  /**
   * Initiate Suspension — sets the Suspended status with the reason and
   * from/to window, and records it on the lifecycle timeline.
   */
  const suspendEmployee = useCallback(
    (id: string, reason: string, from: string, to: string) => {
      const target = employees.find((e) => e.id === id)
      publishAuditEvent({
        module: 'Employee Management',
        action: 'Suspension initiated',
        actor: 'You',
        actorRole: 'HR Manager',
        actionType: 'status-change',
        recordId: target?.code,
        recordName: target?.name,
        changes: [
          {
            field: 'Status',
            previousValue: target?.lifecycleStage ?? null,
            newValue: `Suspended (${from} → ${to})`,
          },
        ],
      })
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === id
            ? {
                ...e,
                lifecycleStage: 'Suspended',
                suspension: { reason, from, to },
                lifecycleEvents: [
                  ...e.lifecycleEvents,
                  {
                    id: `lc-${crypto.randomUUID().slice(0, 6)}`,
                    type: 'Suspended',
                    date: from,
                    note: `Suspension ${from} → ${to}: ${reason}`,
                  },
                ],
              }
            : e
        )
      )
      toast.success(`Suspension initiated — status set to Suspended until ${to}`)
    },
    [employees]
  )

  return {
    employees,
    managerChanges,
    delegations,
    classifyGovernmentIds,
    addEmployee,
    updateEmployee,
    recordManagerChange,
    recordLifecycleEvent,
    runEngines,
    linkUserAccount,
    addDelegation,
    endDelegation,
    addDependant,
    removeDependant,
    addLifeEvent,
    massUpdate,
    applyMappedImport,
    reassignRoles,
    suspendEmployee,
  }
}

export type EmployeesStore = ReturnType<typeof useEmployees>
