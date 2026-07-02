import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  missingStatutoryFields,
  seedStatutoryEmployees,
  type StatutoryEmployee,
} from '../data/compliance'

/**
 * In-memory statutory data store for the compliance registers (RPT-10) and
 * the completeness report (RPT-11). Completing a record removes it from the
 * flagged list on the next render — mirroring a re-run after data entry.
 */
export function useCompliance() {
  const [employees, setEmployees] = useState<StatutoryEmployee[]>(
    seedStatutoryEmployees
  )

  /** Records currently failing the required-field rules (RPT-11, RPT-25). */
  const flagged = useMemo(
    () =>
      employees
        .map((emp) => ({ emp, missing: missingStatutoryFields(emp) }))
        .filter(({ missing }) => missing.length > 0),
    [employees]
  )

  /** Fill the missing statutory identifiers for a record (RPT-11). */
  const completeRecord = (id: string) => {
    const target = employees.find((emp) => emp.id === id)
    if (!target) return
    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.id !== id) return emp
        const serial = emp.id.replace(/\D/g, '').padStart(3, '0')
        return {
          ...emp,
          uan: emp.uan ?? `UAN99${serial}0`,
          pan: emp.pan ?? `ZZAPX${serial}0Z`,
          esicNumber: emp.esicNumber ?? `ESIC-9${serial}`,
        }
      })
    )
    toast.success(
      `${target.name}'s statutory data completed — no longer flagged on re-run`
    )
  }

  return { employees, flagged, completeRecord }
}

export type ComplianceStore = ReturnType<typeof useCompliance>
