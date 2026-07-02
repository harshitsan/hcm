import { type Employee } from '../data/employees'
import { type ApproverGraph, type ScopeRule } from '../data/governance'
import { type DepartmentsStore } from '../hooks/use-departments'

export interface ApprovalStep {
  departmentName: string
  approverName: string
}

export interface ApprovalResolution {
  steps: ApprovalStep[]
  /** Recorded for audit: which membership + config version resolved the path. */
  note: string
}

/**
 * Workflow-engine stand-in (DEPT-16): resolves an employee's approval path
 * from their department membership, the department head effective at routing
 * time, and — when the graph cascades — the parent-department heads in order.
 */
export function resolveApprovalPath(
  store: DepartmentsStore,
  graph: ApproverGraph,
  employee: Employee
): ApprovalResolution {
  // Configured multi-membership rule: the first membership is primary.
  const primaryDeptId = employee.departmentIds[0]
  const primary = primaryDeptId ? store.deptById.get(primaryDeptId) : undefined
  if (!primary) {
    return { steps: [], note: 'No department membership — routing cannot resolve.' }
  }

  const chain = [primary, ...(graph.cascadeToParents ? store.ancestorsOf(primary.id) : [])]
  const steps: ApprovalStep[] = []
  const seen = new Set<string>()
  for (const dept of chain) {
    if (!graph.useDepartmentHead) {
      steps.push({ departmentName: dept.name, approverName: 'Configured approver group' })
      continue
    }
    const head = dept.headId ? store.employeeById.get(dept.headId) : undefined
    if (!head || head.id === employee.id || seen.has(head.id)) continue
    seen.add(head.id)
    steps.push({ departmentName: dept.name, approverName: head.name })
  }

  return {
    steps,
    note: `Resolved via primary membership ${primary.name} using "${graph.name}" v${graph.version} (effective ${graph.effectiveFrom}); heads evaluated at routing time. Resolution recorded for audit.`,
  }
}

export interface PolicyVerdict {
  applies: boolean
  reason: string
}

/**
 * Rules-engine stand-in (DEPT-17): evaluates a department-keyed decision-table
 * row against an employee's memberships and, with cascade, their ancestors.
 * Multi-membership resolution: applies if ANY matching department qualifies.
 */
export function evaluatePolicy(
  store: DepartmentsStore,
  rule: ScopeRule,
  employee: Employee
): PolicyVerdict {
  for (const deptId of employee.departmentIds) {
    if (deptId === rule.departmentId) {
      const dept = store.deptById.get(deptId)
      return {
        applies: true,
        reason: `Direct membership of ${dept?.name ?? deptId} matches the decision-table row.`,
      }
    }
    if (rule.cascade) {
      const ancestor = store
        .ancestorsOf(deptId)
        .find((a) => a.id === rule.departmentId)
      if (ancestor) {
        const dept = store.deptById.get(deptId)
        return {
          applies: true,
          reason: `${dept?.name ?? deptId} descends from ${ancestor.name} and the rule cascades through the hierarchy.`,
        }
      }
    }
  }
  return {
    applies: false,
    reason: 'No current effective membership (or ancestor, where cascade is enabled) matches the rule.',
  }
}
