/**
 * One-shot org chart focus request — mirrors the requested-tab pattern in
 * `@/features/workflows/data/module-nav`: another module (e.g. the
 * Delegations tab in Roles & Security) sets the employee to highlight,
 * navigates to /directory with the Org Chart tab requested, and the chart
 * consumes the request when it mounts. Cleared on read so a stale request
 * never leaks into a later visit.
 */

let requestedEmployeeId: string | null = null

export function requestOrgChartFocus(employeeId: string) {
  requestedEmployeeId = employeeId
}

/** Consume the pending focus request; returns the employee id once. */
export function takeOrgChartFocus(): string | null {
  const id = requestedEmployeeId
  requestedEmployeeId = null
  return id
}
