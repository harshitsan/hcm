import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  GROUP_STANDARD_CLASSES,
  GROUP_STANDARD_PAY_GRADES,
  renderSeries,
  seedEmployeeClasses,
  seedPayGrades,
  seedProjectRoles,
  seedProjectTypes,
  seedProjects,
  seedSeries,
  type EmployeeClass,
  type NumberSeries,
  type PayGrade,
  type ProjectRole,
  type ProjectType,
  type SeriesAppliesTo,
} from '../data/org-config'

export type ProjectTypeDraft = Omit<ProjectType, 'id' | 'nextCodeSeq'>
export type ProjectRoleDraft = Omit<ProjectRole, 'id'>
export type EmployeeClassDraft = Omit<EmployeeClass, 'id'>
export type PayGradeDraft = Omit<PayGrade, 'id'>
export type SeriesDraft = Omit<NumberSeries, 'id'>

export type OrgConfigStore = ReturnType<typeof useOrgConfig>

function shortId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

/**
 * In-memory store for the governed organization configuration the Positions
 * module depends on: project types/roles, employee classifications, pay
 * grades, the position-level paygrade toggle and numbering series.
 */
export function useOrgConfig() {
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>(seedProjectTypes)
  const [projectRoles, setProjectRoles] = useState<ProjectRole[]>(seedProjectRoles)
  const [employeeClasses, setEmployeeClasses] = useState<EmployeeClass[]>(seedEmployeeClasses)
  const [payGrades, setPayGrades] = useState<PayGrade[]>(seedPayGrades)
  const [series, setSeries] = useState<NumberSeries[]>(seedSeries)
  /** "Do you support position level paygrade?" (POS-20). */
  const [payGradeEnabled, setPayGradeEnabled] = useState(true)
  const projects = seedProjects

  // ---- Project types (POS-24/42) ----
  const addProjectType = useCallback((draft: ProjectTypeDraft) => {
    setProjectTypes((prev) => [{ ...draft, id: shortId('pt'), nextCodeSeq: 1 }, ...prev])
    toast.success(`Project type "${draft.name}" added`)
  }, [])

  const updateProjectType = useCallback((id: string, draft: ProjectTypeDraft) => {
    setProjectTypes((prev) => prev.map((t) => (t.id === id ? { ...t, ...draft } : t)))
    toast.success(`Project type "${draft.name}" updated`)
  }, [])

  // ---- Project roles (POS-26/27/40/44) ----
  const addProjectRole = useCallback((draft: ProjectRoleDraft) => {
    setProjectRoles((prev) => [{ ...draft, id: shortId('pr') }, ...prev])
    toast.success(`Project role "${draft.name}" added`)
  }, [])

  const updateProjectRole = useCallback((id: string, draft: ProjectRoleDraft) => {
    setProjectRoles((prev) => prev.map((r) => (r.id === id ? { ...r, ...draft } : r)))
    toast.success(`Project role "${draft.name}" updated`)
  }, [])

  const setRoleQuestions = useCallback((id: string, questions: string[]) => {
    setProjectRoles((prev) => prev.map((r) => (r.id === id ? { ...r, questions } : r)))
    toast.success('Evaluation questions saved')
  }, [])

  // ---- Employee classifications (POS-29/30/31) ----
  const addEmployeeClass = useCallback((draft: EmployeeClassDraft) => {
    setEmployeeClasses((prev) => [{ ...draft, id: shortId('ec') }, ...prev])
    toast.success(`Employee class "${draft.name}" added`)
  }, [])

  const updateEmployeeClass = useCallback((id: string, draft: EmployeeClassDraft) => {
    setEmployeeClasses((prev) => prev.map((c) => (c.id === id ? { ...c, ...draft } : c)))
    toast.success(`Employee class "${draft.name}" updated`)
  }, [])

  const setClassStatus = useCallback((id: string, status: EmployeeClass['status']) => {
    setEmployeeClasses((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)))
    toast.success(status === 'active' ? 'Class reactivated' : 'Class set inactive — historical references retained')
  }, [])

  // ---- Pay grades (POS-36) ----
  const addPayGrade = useCallback((draft: PayGradeDraft) => {
    setPayGrades((prev) => [{ ...draft, id: shortId('pg') }, ...prev])
    toast.success(`Pay grade "${draft.name}" saved`)
  }, [])

  const updatePayGrade = useCallback((id: string, draft: PayGradeDraft) => {
    setPayGrades((prev) => prev.map((g) => (g.id === id ? { ...g, ...draft } : g)))
    toast.success(`Pay grade "${draft.name}" updated — historical records preserved`)
  }, [])

  /** Band mapped to a position level within a company, if any (POS-36/37). */
  const gradeForLevel = useCallback(
    (companyId: string, level: number | null) =>
      level == null
        ? undefined
        : payGrades.find((g) => g.companyId === companyId && g.level === level),
    [payGrades]
  )

  // ---- Numbering series (POS-35) ----
  const addSeries = useCallback((draft: SeriesDraft) => {
    setSeries((prev) => [{ ...draft, id: shortId('ser') }, ...prev])
    toast.success(`Series "${draft.name}" saved`)
  }, [])

  const updateSeries = useCallback((id: string, draft: SeriesDraft) => {
    setSeries((prev) => prev.map((s) => (s.id === id ? { ...s, ...draft } : s)))
    toast.success('Series rule updated — existing IDs remain unchanged')
  }, [])

  /** Consumes the next number from the applicable series and returns the ID. */
  const generateId = useCallback(
    (companyId: string, appliesTo: SeriesAppliesTo): string => {
      const match = series.find(
        (s) => s.companyId === companyId && s.appliesTo === appliesTo
      )
      if (!match) return shortId(appliesTo === 'Position ID' ? 'POS' : 'EMP')
      setSeries((prev) =>
        prev.map((s) => (s.id === match.id ? { ...s, nextNumber: s.nextNumber + 1 } : s))
      )
      return renderSeries(match.template, match.nextNumber)
    },
    [series]
  )

  // ---- Group standardization (POS-33/45) ----
  const seedStandardClasses = useCallback((companyId: string) => {
    setEmployeeClasses((prev) => {
      const additions = GROUP_STANDARD_CLASSES.filter(
        (std) => !prev.some((c) => c.companyId === companyId && c.acronym === std.acronym)
      ).map((std) => ({ ...std, id: shortId('ec'), companyId }))
      if (additions.length === 0) {
        toast.info('Company already aligned to the group standard classes')
        return prev
      }
      toast.success(`${additions.length} standard class(es) seeded — scoped to the company`)
      return [...additions, ...prev]
    })
  }, [])

  const seedStandardPayGrades = useCallback((companyId: string) => {
    setPayGrades((prev) => {
      const additions = GROUP_STANDARD_PAY_GRADES.filter(
        (std) => !prev.some((g) => g.companyId === companyId && g.level === std.level)
      ).map((std) => ({ ...std, id: shortId('pg'), companyId }))
      if (additions.length === 0) {
        toast.info('Company already has grades for the standard levels')
        return prev
      }
      toast.success(`${additions.length} standard band(s) seeded — scoped to the company`)
      return [...additions, ...prev]
    })
  }, [])

  return {
    projectTypes,
    projectRoles,
    employeeClasses,
    payGrades,
    series,
    projects,
    payGradeEnabled,
    setPayGradeEnabled,
    addProjectType,
    updateProjectType,
    addProjectRole,
    updateProjectRole,
    setRoleQuestions,
    addEmployeeClass,
    updateEmployeeClass,
    setClassStatus,
    addPayGrade,
    updatePayGrade,
    gradeForLevel,
    addSeries,
    updateSeries,
    generateId,
    seedStandardClasses,
    seedStandardPayGrades,
  }
}
