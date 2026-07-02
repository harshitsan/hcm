/**
 * Role assignments — effective-dated records with full history (RSEC-15).
 * Assignments are never physically deleted: ending one sets its
 * effective-to date and the row is retained, so "as-of" queries can
 * reconstruct who held which role at any point in time. A single user may
 * hold different roles in different companies (RSEC-02).
 */
export interface RoleAssignment {
  id: string
  personId: string
  roleId: string
  companyId: string
  effectiveFrom: string
  /** Null = open-ended. A revoked assignment keeps its row with an end date. */
  effectiveTo: string | null
  assignedBy: string
  recordedOn: string
}

export type AssignmentStatus = 'Active' | 'Scheduled' | 'Ended'

/** Status of an assignment as of a given date (RSEC-15 as-of queries). */
export function assignmentStatusOn(
  a: RoleAssignment,
  asOf: string
): AssignmentStatus {
  if (a.effectiveFrom > asOf) return 'Scheduled'
  if (a.effectiveTo && a.effectiveTo < asOf) return 'Ended'
  return 'Active'
}

export const seedAssignments: RoleAssignment[] = [
  {
    id: 'asg-01',
    personId: 'emp-01',
    roleId: 'role-08',
    companyId: 'co-1',
    effectiveFrom: '2026-01-01',
    effectiveTo: null,
    assignedBy: 'Sunita Patil',
    recordedOn: '2025-12-30',
  },
  {
    id: 'asg-02',
    personId: 'emp-01',
    roleId: 'role-07',
    companyId: 'co-1',
    effectiveFrom: '2026-03-01',
    effectiveTo: null,
    assignedBy: 'Sunita Patil',
    recordedOn: '2026-02-20',
  },
  {
    id: 'asg-03',
    personId: 'emp-03',
    roleId: 'role-08',
    companyId: 'co-1',
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-02-28',
    assignedBy: 'Sunita Patil',
    recordedOn: '2025-12-30',
  },
  {
    id: 'asg-04',
    personId: 'emp-03',
    roleId: 'role-05',
    companyId: 'co-1',
    effectiveFrom: '2026-03-01',
    effectiveTo: null,
    assignedBy: 'Arjun Mehta',
    recordedOn: '2026-02-25',
  },
  {
    id: 'asg-05',
    personId: 'emp-04',
    roleId: 'role-06',
    companyId: 'co-1',
    effectiveFrom: '2026-01-15',
    effectiveTo: null,
    assignedBy: 'Sunita Patil',
    recordedOn: '2026-01-10',
  },
  // RSEC-02: one user with different roles in different companies.
  {
    id: 'asg-06',
    personId: 'emp-06',
    roleId: 'role-09',
    companyId: 'co-2',
    effectiveFrom: '2026-02-15',
    effectiveTo: null,
    assignedBy: 'Devika Rao',
    recordedOn: '2026-02-10',
  },
  {
    id: 'asg-07',
    personId: 'emp-06',
    roleId: 'role-07',
    companyId: 'co-1',
    effectiveFrom: '2026-04-01',
    effectiveTo: null,
    assignedBy: 'Arjun Mehta',
    recordedOn: '2026-03-25',
  },
  {
    id: 'asg-08',
    personId: 'emp-05',
    roleId: 'role-09',
    companyId: 'co-2',
    effectiveFrom: '2026-02-15',
    effectiveTo: '2026-05-31',
    assignedBy: 'Devika Rao',
    recordedOn: '2026-02-10',
  },
  {
    id: 'asg-09',
    personId: 'emp-07',
    roleId: 'role-03',
    companyId: 'co-2',
    effectiveFrom: '2026-04-01',
    effectiveTo: null,
    assignedBy: 'Arjun Mehta',
    recordedOn: '2026-03-20',
  },
  {
    id: 'asg-10',
    personId: 'emp-08',
    roleId: 'role-04',
    companyId: 'co-3',
    effectiveFrom: '2026-02-01',
    effectiveTo: null,
    assignedBy: 'Devika Rao',
    recordedOn: '2026-01-28',
  },
  {
    id: 'asg-11',
    personId: 'emp-09',
    roleId: 'role-10',
    companyId: 'co-3',
    effectiveFrom: '2026-08-01',
    effectiveTo: null,
    assignedBy: 'Devika Rao',
    recordedOn: '2026-06-15',
  },
  {
    id: 'asg-12',
    personId: 'emp-10',
    roleId: 'role-04',
    companyId: 'co-4',
    effectiveFrom: '2026-03-01',
    effectiveTo: null,
    assignedBy: 'Devika Rao',
    recordedOn: '2026-02-22',
  },
  {
    id: 'asg-13',
    personId: 'emp-14',
    roleId: 'role-08',
    companyId: 'co-1',
    effectiveFrom: '2026-05-01',
    effectiveTo: null,
    assignedBy: 'Sunita Patil',
    recordedOn: '2026-04-28',
  },
  {
    id: 'asg-14',
    personId: 'emp-02',
    roleId: 'role-08',
    companyId: 'co-1',
    effectiveFrom: '2026-01-01',
    effectiveTo: null,
    assignedBy: 'Sunita Patil',
    recordedOn: '2025-12-30',
  },
]
