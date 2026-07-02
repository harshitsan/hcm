/**
 * Append-only workflow audit trail (WFE-12). Every action, approval,
 * escalation, routing decision, config change and security event is
 * captured with actor, timestamp and detail.
 */

export type AuditCategory =
  | 'action'
  | 'approval'
  | 'rejection'
  | 'escalation'
  | 'reassignment'
  | 'routing'
  | 'reminder'
  | 'config'
  | 'security'

export const AUDIT_CATEGORY_LABELS: Record<AuditCategory, string> = {
  action: 'Action',
  approval: 'Approval',
  rejection: 'Rejection',
  escalation: 'Escalation',
  reassignment: 'Reassignment',
  routing: 'Routing decision',
  reminder: 'SLA reminder',
  config: 'Config change',
  security: 'Security',
}

export interface AuditEvent {
  id: string
  timestamp: string
  actor: string
  actorRole: string
  company: string
  category: AuditCategory
  summary: string
  detail: string
  refId: string
}

export const seedAuditEvents: AuditEvent[] = [
  {
    id: 'aud-001',
    timestamp: '2026-06-24 09:14',
    actor: 'Workflow Engine',
    actorRole: 'System',
    company: 'Aurora Foods',
    category: 'routing',
    summary: 'Routed "Annual leave — 5 days (Diwali)"',
    detail:
      'Matched rule rt-03 (Leave Request · Aurora Foods · priority 3) → Leave Approval — Standard v2. Bound to version effective 2026-04-01.',
    refId: 'ins-9001',
  },
  {
    id: 'aud-002',
    timestamp: '2026-06-24 09:14',
    actor: 'Workflow Engine',
    actorRole: 'System',
    company: 'Aurora Foods',
    category: 'action',
    summary: 'Task assigned to Vikram Rao',
    detail: 'Stage "Manager Review" (sequential) · SLA 16 business hours on India Standard calendar.',
    refId: 'tsk-501',
  },
  {
    id: 'aud-003',
    timestamp: '2026-06-25 07:02',
    actor: 'Workflow Engine',
    actorRole: 'System',
    company: 'Aurora Foods',
    category: 'reminder',
    summary: '50% SLA reminder sent to Vikram Rao',
    detail: 'Instance ins-9001 · stage "Manager Review" reached 50% of its 16 h SLA.',
    refId: 'ins-9001',
  },
  {
    id: 'aud-004',
    timestamp: '2026-06-25 11:40',
    actor: 'Workflow Engine',
    actorRole: 'System',
    company: 'Aurora Foods',
    category: 'reassignment',
    summary: 'Overtime review reassigned Rohit Verma → Ananya Sharma',
    detail:
      'Time-based reassignment fired after 8 h without action on ins-9002 (approver on leave). New task issued with SLA context.',
    refId: 'ins-9002',
  },
  {
    id: 'aud-005',
    timestamp: '2026-06-20 16:05',
    actor: 'Vikram Rao',
    actorRole: 'Approver',
    company: 'Aurora Foods',
    category: 'approval',
    summary: 'Approved "Manager Handover" for exit clearance',
    detail: 'ins-9004 advanced from stage 1/3 to "Clearance Panel" (parallel — all must approve).',
    refId: 'ins-9004',
  },
  {
    id: 'aud-006',
    timestamp: '2026-06-19 10:30',
    actor: 'Workflow Engine',
    actorRole: 'System',
    company: 'Aurora Foods',
    category: 'escalation',
    summary: 'Attendance change escalated David Kim → Ananya Sharma',
    detail:
      'Multi-level escalation, level 1 exhausted at 100% SLA. Reason: no action within 8 business hours. Target: next level (Payroll Review).',
    refId: 'ins-9005',
  },
  {
    id: 'aud-007',
    timestamp: '2026-05-21 12:12',
    actor: 'Farhan Ali',
    actorRole: 'Approver',
    company: 'Aurora Foods',
    category: 'rejection',
    summary: 'Rejected "Expense claim — ₹92,000 offsite"',
    detail:
      'Amount above ₹50k threshold for this route. Parallel any-one step: remaining tasks for David Kim and Ananya Sharma were closed; downstream approvers never engaged.',
    refId: 'ins-9010',
  },
  {
    id: 'aud-008',
    timestamp: '2026-03-28 15:47',
    actor: 'Sunita Patil',
    actorRole: 'Company Admin',
    company: 'Aurora Foods',
    category: 'config',
    summary: 'Published Leave Approval — Standard v2',
    detail:
      'Added HR Sign-off stage; SLA tightened 24 h → 16 h on Manager Review. v1 superseded (retained); in-flight requests continue on v1.',
    refId: 'wf-100-v2',
  },
  {
    id: 'aud-009',
    timestamp: '2026-06-02 11:21',
    actor: 'Sunita Patil',
    actorRole: 'Company Admin',
    company: 'Aurora Foods',
    category: 'config',
    summary: 'Updated Change Request approver chain',
    detail: 'Payroll cutoff set to day 25; second-level approval enabled for post-cutoff requests.',
    refId: 'ag-04',
  },
  {
    id: 'aud-010',
    timestamp: '2026-06-22 09:00',
    actor: 'Workflow Engine',
    actorRole: 'System',
    company: 'Northwind Logistics',
    category: 'routing',
    summary: 'Routed "Confirmation — probation complete (J. Torres)"',
    detail: 'Matched rule rt-08 (Confirmation · Northwind · Austin · priority 8) → Confirmation Review — Logistics v1.',
    refId: 'ins-9007',
  },
  {
    id: 'aud-011',
    timestamp: '2026-06-26 14:55',
    actor: 'Workflow Engine',
    actorRole: 'System',
    company: 'Northwind Logistics',
    category: 'reminder',
    summary: '75% SLA reminder sent to HR Panel',
    detail: 'ins-9007 · parallel any-one stage at 85% of 24 h SLA — at-risk.',
    refId: 'ins-9007',
  },
  {
    id: 'aud-012',
    timestamp: '2026-06-11 08:20',
    actor: 'Workflow Engine',
    actorRole: 'System',
    company: 'Zenith Software',
    category: 'routing',
    summary: 'Routed "Layoff — 14 warehouse roles"',
    detail:
      'Minimum-employee threshold (10) met with 14 affected roles. Matched rule rt-09 → Layoff Approval — Zenith v1 (parallel — all must approve).',
    refId: 'ins-9008',
  },
  {
    id: 'aud-013',
    timestamp: '2026-06-14 03:12',
    actor: 'tenant: meridian-corp',
    actorRole: 'External',
    company: 'Platform',
    category: 'security',
    summary: 'Cross-tenant query denied',
    detail:
      'Row-level security blocked a read of Aurora Group workflow instances from tenant meridian-corp. Attempt logged and reported.',
    refId: 'rls-4411',
  },
  {
    id: 'aud-014',
    timestamp: '2026-06-20 10:00',
    actor: 'Arjun Mehta',
    actorRole: 'Group Company Admin',
    company: 'Aurora Fresh Retail',
    category: 'config',
    summary: 'Applied group standard to WFH Approval — Retail',
    detail: 'Company-specific SLA override (12 h) retained; group escalation standard enforced.',
    refId: 'wf-104-v1',
  },
  {
    id: 'aud-015',
    timestamp: '2026-03-03 09:41',
    actor: 'Vikram Rao',
    actorRole: 'Approver',
    company: 'Aurora Foods',
    category: 'approval',
    summary: 'Approved "Leave — bereavement 3 days"',
    detail: 'Final sequential step approved — ins-9009 reached approved terminal state on definition v1.',
    refId: 'ins-9009',
  },
]
