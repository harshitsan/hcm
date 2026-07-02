import type {
  ApprovalPattern,
  EscalationStrategy,
  TransactionType,
} from './shared'

/**
 * Effective-dated, versioned workflow definitions (WFE-01, WFE-20, WFE-22).
 * Editing an active definition supersedes it and creates a new version;
 * in-flight instances stay bound to the version active at initiation.
 */

export type DefinitionStatus = 'draft' | 'active' | 'scheduled' | 'superseded'

export interface WorkflowStage {
  id: string
  name: string
  pattern: ApprovalPattern
  /** Ordered approver chain (order matters for sequential stages). */
  approvers: string[]
  escalation: EscalationStrategy
  /** Manager strategy resolves via reporting line; others name a role/person. */
  escalationTarget: string
  slaHours: number
}

export interface WorkflowDefinition {
  id: string
  /** Stable key shared by all versions of the same workflow. */
  workflowKey: string
  name: string
  transactionType: TransactionType
  company: string
  version: number
  status: DefinitionStatus
  effectiveFrom: string
  effectiveTo: string | null
  calendarId: string
  stages: WorkflowStage[]
  updatedBy: string
  updatedAt: string
}

export const seedDefinitions: WorkflowDefinition[] = [
  {
    id: 'wf-100-v2',
    workflowKey: 'wf-100',
    name: 'Leave Approval — Standard',
    transactionType: 'Leave Request',
    company: 'Aurora Foods',
    version: 2,
    status: 'active',
    effectiveFrom: '2026-04-01',
    effectiveTo: null,
    calendarId: 'cal-ist',
    stages: [
      {
        id: 'st-1',
        name: 'Manager Review',
        pattern: 'sequential',
        approvers: ['Vikram Rao'],
        escalation: 'manager',
        escalationTarget: 'Reporting manager',
        slaHours: 16,
      },
      {
        id: 'st-2',
        name: 'HR Sign-off',
        pattern: 'sequential',
        approvers: ['Priya Menon', 'Sunita Patil'],
        escalation: 'role',
        escalationTarget: 'HR Director',
        slaHours: 24,
      },
    ],
    updatedBy: 'Sunita Patil',
    updatedAt: '2026-03-28',
  },
  {
    id: 'wf-100-v1',
    workflowKey: 'wf-100',
    name: 'Leave Approval — Standard',
    transactionType: 'Leave Request',
    company: 'Aurora Foods',
    version: 1,
    status: 'superseded',
    effectiveFrom: '2025-01-01',
    effectiveTo: '2026-03-31',
    calendarId: 'cal-ist',
    stages: [
      {
        id: 'st-1',
        name: 'Manager Review',
        pattern: 'sequential',
        approvers: ['Vikram Rao'],
        escalation: 'manager',
        escalationTarget: 'Reporting manager',
        slaHours: 24,
      },
    ],
    updatedBy: 'Sunita Patil',
    updatedAt: '2024-12-20',
  },
  {
    id: 'wf-101-v1',
    workflowKey: 'wf-101',
    name: 'Overtime Approval — Plants',
    transactionType: 'Overtime',
    company: 'Aurora Foods',
    version: 1,
    status: 'active',
    effectiveFrom: '2025-06-01',
    effectiveTo: null,
    calendarId: 'cal-ist',
    stages: [
      {
        id: 'st-1',
        name: 'Supervisor Review',
        pattern: 'sequential',
        approvers: ['Rohit Verma'],
        escalation: 'time-reassignment',
        escalationTarget: 'Meera Iyer',
        slaHours: 8,
      },
      {
        id: 'st-2',
        name: 'Ops & Payroll Clearance',
        pattern: 'parallel-all',
        approvers: ['Meera Iyer', 'David Kim'],
        escalation: 'multi-level',
        escalationTarget: 'Operations Head',
        slaHours: 16,
      },
    ],
    updatedBy: 'Sunita Patil',
    updatedAt: '2025-05-22',
  },
  {
    id: 'wf-102-v1',
    workflowKey: 'wf-102',
    name: 'Expense Claim — Under ₹50k',
    transactionType: 'Expense Claim',
    company: 'Aurora Foods',
    version: 1,
    status: 'active',
    effectiveFrom: '2025-09-15',
    effectiveTo: null,
    calendarId: 'cal-ist',
    stages: [
      {
        id: 'st-1',
        name: 'Finance Desk',
        pattern: 'parallel-any',
        approvers: ['Farhan Ali', 'David Kim', 'Ananya Sharma'],
        escalation: 'role',
        escalationTarget: 'Finance Controller',
        slaHours: 24,
      },
    ],
    updatedBy: 'Farhan Ali',
    updatedAt: '2025-09-10',
  },
  {
    id: 'wf-103-v1',
    workflowKey: 'wf-103',
    name: 'Exit Clearance — Corporate',
    transactionType: 'Exit Clearance',
    company: 'Aurora Foods',
    version: 1,
    status: 'active',
    effectiveFrom: '2025-11-01',
    effectiveTo: null,
    calendarId: 'cal-ist',
    stages: [
      {
        id: 'st-1',
        name: 'Manager Handover',
        pattern: 'sequential',
        approvers: ['Vikram Rao'],
        escalation: 'manager',
        escalationTarget: 'Reporting manager',
        slaHours: 40,
      },
      {
        id: 'st-2',
        name: 'Clearance Panel',
        pattern: 'parallel-all',
        approvers: ['Priya Menon', 'Farhan Ali', 'Elena Garcia'],
        escalation: 'role',
        escalationTarget: 'HR Director',
        slaHours: 40,
      },
      {
        id: 'st-3',
        name: 'Final HR Sign-off',
        pattern: 'sequential',
        approvers: ['Sunita Patil'],
        escalation: 'multi-level',
        escalationTarget: 'Group HR Head',
        slaHours: 24,
      },
    ],
    updatedBy: 'Sunita Patil',
    updatedAt: '2025-10-25',
  },
  {
    id: 'wf-104-v1',
    workflowKey: 'wf-104',
    name: 'WFH Approval — Retail',
    transactionType: 'Work From Home',
    company: 'Aurora Fresh Retail',
    version: 1,
    status: 'active',
    effectiveFrom: '2026-01-01',
    effectiveTo: null,
    calendarId: 'cal-ist',
    stages: [
      {
        id: 'st-1',
        name: 'Store Manager Review',
        pattern: 'sequential',
        approvers: ['Meera Iyer'],
        escalation: 'manager',
        escalationTarget: 'Reporting manager',
        slaHours: 12,
      },
    ],
    updatedBy: 'Arjun Mehta',
    updatedAt: '2025-12-18',
  },
  {
    id: 'wf-105-v1',
    workflowKey: 'wf-105',
    name: 'Confirmation Review — Logistics',
    transactionType: 'Confirmation',
    company: 'Northwind Logistics',
    version: 1,
    status: 'active',
    effectiveFrom: '2025-08-01',
    effectiveTo: null,
    calendarId: 'cal-us',
    stages: [
      {
        id: 'st-1',
        name: 'Manager Assessment',
        pattern: 'sequential',
        approvers: ['Vikram Rao'],
        escalation: 'manager',
        escalationTarget: 'Reporting manager',
        slaHours: 48,
      },
      {
        id: 'st-2',
        name: 'HR Panel',
        pattern: 'parallel-any',
        approvers: ['Priya Menon', 'Sunita Patil'],
        escalation: 'role',
        escalationTarget: 'HR Director',
        slaHours: 24,
      },
    ],
    updatedBy: 'Devika Rao',
    updatedAt: '2025-07-29',
  },
  {
    id: 'wf-106-v1',
    workflowKey: 'wf-106',
    name: 'Attendance Change — Post-payroll',
    transactionType: 'Attendance Change',
    company: 'Aurora Foods',
    version: 1,
    status: 'scheduled',
    effectiveFrom: '2026-08-01',
    effectiveTo: null,
    calendarId: 'cal-ist',
    stages: [
      {
        id: 'st-1',
        name: 'Supervisor Review',
        pattern: 'sequential',
        approvers: ['Rohit Verma'],
        escalation: 'manager',
        escalationTarget: 'Reporting manager',
        slaHours: 8,
      },
      {
        id: 'st-2',
        name: 'Payroll Second Level',
        pattern: 'sequential',
        approvers: ['David Kim'],
        escalation: 'role',
        escalationTarget: 'Finance Controller',
        slaHours: 8,
      },
    ],
    updatedBy: 'Sunita Patil',
    updatedAt: '2026-06-20',
  },
  {
    id: 'wf-107-v1',
    workflowKey: 'wf-107',
    name: 'Disciplinary Action — Draft',
    transactionType: 'Disciplinary Action',
    company: 'Aurora Foods',
    version: 1,
    status: 'draft',
    effectiveFrom: '2026-09-01',
    effectiveTo: null,
    calendarId: 'cal-ist',
    // Intentionally incomplete: activation must be blocked by validation
    // until every stage has approvers and an SLA (WFE-01, WFE-22, WFE-25).
    stages: [
      {
        id: 'st-1',
        name: 'HR Investigation',
        pattern: 'sequential',
        approvers: [],
        escalation: 'role',
        escalationTarget: 'HR Director',
        slaHours: 0,
      },
    ],
    updatedBy: 'Priya Menon',
    updatedAt: '2026-06-24',
  },
  {
    id: 'wf-108-v1',
    workflowKey: 'wf-108',
    name: 'Layoff Approval — Zenith',
    transactionType: 'Layoff',
    company: 'Zenith Software',
    version: 1,
    status: 'active',
    effectiveFrom: '2025-10-01',
    effectiveTo: null,
    calendarId: 'cal-us',
    stages: [
      {
        id: 'st-1',
        name: 'Leadership Consensus',
        pattern: 'parallel-all',
        approvers: ['Meera Iyer', 'Farhan Ali', 'Sunita Patil'],
        escalation: 'multi-level',
        escalationTarget: 'Group HR Head',
        slaHours: 72,
      },
    ],
    updatedBy: 'Devika Rao',
    updatedAt: '2025-09-26',
  },
]
