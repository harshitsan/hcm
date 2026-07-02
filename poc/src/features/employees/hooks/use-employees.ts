import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  companyName,
  seedDelegations,
  seedEmployees,
  seedManagerChanges,
  type Delegation,
  type Dependant,
  type Employee,
  type LifeEvent,
  type LifecycleStage,
  type ManagerChange,
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
>

export type DedupClassification =
  | { kind: 'clear' }
  | { kind: 'same-company'; field: string; existing: string }
  | { kind: 'separate-company'; field: string; existing: string }

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
      const checks: Array<['Aadhar' | 'PAN' | 'Passport', string]> = [
        ['Aadhar', draft.aadhar],
        ['PAN', draft.pan],
        ['Passport', draft.passport],
      ]
      for (const [field, value] of checks) {
        if (!value) continue
        const hit = employees.find(
          (e) =>
            e.id !== excludeId &&
            ((field === 'Aadhar' && e.aadhar === value) ||
              (field === 'PAN' && e.pan === value) ||
              (field === 'Passport' && e.passport === value))
        )
        if (!hit) continue
        if (hit.companyId === draft.companyId) {
          return {
            kind: 'same-company',
            field,
            existing: `${hit.name} (${hit.code}) — ${companyName(hit.companyId)}`,
          }
        }
        return {
          kind: 'separate-company',
          field,
          existing: `${hit.name} (${hit.code}) — ${companyName(hit.companyId)}`,
        }
      }
      return { kind: 'clear' }
    },
    [employees]
  )

  const addEmployee = useCallback((draft: EmployeeDraft) => {
    const employee: Employee = {
      ...draft,
      id: `e-${crypto.randomUUID().slice(0, 8)}`,
      code: `NEW-${String(Math.floor(1000 + Math.random() * 9000))}`,
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
    toast.success(`${draft.name} added to ${companyName(draft.companyId)}`)
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
      toast.success(`Lifecycle event recorded — stage set to ${type}`)
    },
    []
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

  /** EMP-43 — apply one attribute value across many employee records. */
  const massUpdate = useCallback(
    (ids: string[], field: 'position' | 'employeeClass' | 'jurisdiction', value: string) => {
      setEmployees((prev) =>
        prev.map((e) => (ids.includes(e.id) ? { ...e, [field]: value } : e))
      )
      toast.success(`${ids.length} employee record(s) updated`)
    },
    []
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
  }
}

export type EmployeesStore = ReturnType<typeof useEmployees>
