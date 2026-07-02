import type {
  ApprovalPattern,
  EscalationStrategy,
  TransactionType,
} from './shared'

/**
 * Workflow instances + approval tasks (WFE-13, WFE-21, WFE-26). Every
 * instance is bound to the definition version active when it started
 * (WFE-20) and persists full stage/decision history (WFE-21).
 */

export type InstanceStatus = 'in-progress' | 'approved' | 'rejected'

export type ApprovalDecision =
  | 'pending'
  | 'waiting'
  | 'approved'
  | 'rejected'
  | 'closed'

export interface StageApproval {
  approver: string
  decision: ApprovalDecision
}

export type StageStatus =
  | 'waiting'
  | 'in-progress'
  | 'approved'
  | 'rejected'
  | 'skipped'

export interface InstanceStage {
  id: string
  name: string
  pattern: ApprovalPattern
  status: StageStatus
  approvals: StageApproval[]
  escalation: EscalationStrategy
  escalationTarget: string
  slaHours: number
}

export interface WorkflowInstance {
  id: string
  title: string
  transactionType: TransactionType
  requester: string
  company: string
  department: string
  location: string
  definitionName: string
  definitionVersion: number
  status: InstanceStatus
  startedAt: string
  completedAt: string | null
  currentStageIndex: number
  stages: InstanceStage[]
}

export type TaskVia =
  | 'normal'
  | 'manager'
  | 'role'
  | 'time-reassignment'
  | 'multi-level'

export const TASK_VIA_LABELS: Record<TaskVia, string> = {
  normal: 'Direct assignment',
  manager: 'Manager escalation',
  role: 'Role escalation',
  'time-reassignment': 'Time-based reassignment',
  'multi-level': 'Multi-level escalation',
}

export type TaskStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'closed'
  | 'escalated'

export interface ApprovalTask {
  id: string
  instanceId: string
  stageId: string
  stageName: string
  pattern: ApprovalPattern
  approver: string
  status: TaskStatus
  via: TaskVia
  /** % of the SLA consumed. 50/75 fire reminders; 100 escalates (WFE-10). */
  slaPercent: number
  slaHours: number
  assignedAt: string
  decidedAt: string | null
  escalatedFrom: string | null
}

/** SLA health bucket derived from % consumed (WFE-11). */
export type SlaState = 'on-track' | 'reminded' | 'at-risk' | 'breached'

export function slaState(percent: number): SlaState {
  if (percent >= 100) return 'breached'
  if (percent >= 75) return 'at-risk'
  if (percent >= 50) return 'reminded'
  return 'on-track'
}

export function slaRemainingLabel(percent: number, slaHours: number): string {
  if (percent >= 100) {
    const over = Math.round(((percent - 100) / 100) * slaHours)
    return `Breached by ~${over} h`
  }
  const left = Math.round(((100 - percent) / 100) * slaHours)
  return `~${left} h remaining`
}

export const seedInstances: WorkflowInstance[] = [
  {
    id: 'ins-9001',
    title: 'Annual leave — 5 days (Diwali)',
    transactionType: 'Leave Request',
    requester: 'Kiran Kulkarni',
    company: 'Aurora Foods',
    department: 'Engineering',
    location: 'Hyderabad',
    definitionName: 'Leave Approval — Standard',
    definitionVersion: 2,
    status: 'in-progress',
    startedAt: '2026-06-24',
    completedAt: null,
    currentStageIndex: 0,
    stages: [
      {
        id: 'st-1',
        name: 'Manager Review',
        pattern: 'sequential',
        status: 'in-progress',
        approvals: [{ approver: 'Vikram Rao', decision: 'pending' }],
        escalation: 'manager',
        escalationTarget: 'Reporting manager',
        slaHours: 16,
      },
      {
        id: 'st-2',
        name: 'HR Sign-off',
        pattern: 'sequential',
        status: 'waiting',
        approvals: [
          { approver: 'Priya Menon', decision: 'waiting' },
          { approver: 'Sunita Patil', decision: 'waiting' },
        ],
        escalation: 'role',
        escalationTarget: 'HR Director',
        slaHours: 24,
      },
    ],
  },
  {
    id: 'ins-9002',
    title: 'Overtime — 12 hrs line maintenance',
    transactionType: 'Overtime',
    requester: 'Ravi Naik',
    company: 'Aurora Foods',
    department: 'Operations',
    location: 'Chennai',
    definitionName: 'Overtime Approval — Plants',
    definitionVersion: 1,
    status: 'in-progress',
    startedAt: '2026-06-23',
    completedAt: null,
    currentStageIndex: 0,
    stages: [
      {
        id: 'st-1',
        name: 'Supervisor Review',
        pattern: 'sequential',
        status: 'in-progress',
        approvals: [{ approver: 'Ananya Sharma', decision: 'pending' }],
        escalation: 'time-reassignment',
        escalationTarget: 'Meera Iyer',
        slaHours: 8,
      },
      {
        id: 'st-2',
        name: 'Ops & Payroll Clearance',
        pattern: 'parallel-all',
        status: 'waiting',
        approvals: [
          { approver: 'Meera Iyer', decision: 'waiting' },
          { approver: 'David Kim', decision: 'waiting' },
        ],
        escalation: 'multi-level',
        escalationTarget: 'Operations Head',
        slaHours: 16,
      },
    ],
  },
  {
    id: 'ins-9003',
    title: 'Expense claim — ₹18,400 travel',
    transactionType: 'Expense Claim',
    requester: 'Sneha Joshi',
    company: 'Aurora Foods',
    department: 'Sales',
    location: 'Pune',
    definitionName: 'Expense Claim — Under ₹50k',
    definitionVersion: 1,
    status: 'in-progress',
    startedAt: '2026-06-25',
    completedAt: null,
    currentStageIndex: 0,
    stages: [
      {
        id: 'st-1',
        name: 'Finance Desk',
        pattern: 'parallel-any',
        status: 'in-progress',
        approvals: [
          { approver: 'Farhan Ali', decision: 'pending' },
          { approver: 'David Kim', decision: 'pending' },
          { approver: 'Ananya Sharma', decision: 'pending' },
        ],
        escalation: 'role',
        escalationTarget: 'Finance Controller',
        slaHours: 24,
      },
    ],
  },
  {
    id: 'ins-9004',
    title: 'Exit clearance — QA Analyst (Meenal D.)',
    transactionType: 'Exit Clearance',
    requester: 'Priya Menon',
    company: 'Aurora Foods',
    department: 'Human Resources',
    location: 'Hyderabad',
    definitionName: 'Exit Clearance — Corporate',
    definitionVersion: 1,
    status: 'in-progress',
    startedAt: '2026-06-18',
    completedAt: null,
    currentStageIndex: 1,
    stages: [
      {
        id: 'st-1',
        name: 'Manager Handover',
        pattern: 'sequential',
        status: 'approved',
        approvals: [{ approver: 'Vikram Rao', decision: 'approved' }],
        escalation: 'manager',
        escalationTarget: 'Reporting manager',
        slaHours: 40,
      },
      {
        id: 'st-2',
        name: 'Clearance Panel',
        pattern: 'parallel-all',
        status: 'in-progress',
        approvals: [
          { approver: 'Priya Menon', decision: 'approved' },
          { approver: 'Farhan Ali', decision: 'pending' },
          { approver: 'Elena Garcia', decision: 'pending' },
        ],
        escalation: 'role',
        escalationTarget: 'HR Director',
        slaHours: 40,
      },
      {
        id: 'st-3',
        name: 'Final HR Sign-off',
        pattern: 'sequential',
        status: 'waiting',
        approvals: [{ approver: 'Sunita Patil', decision: 'waiting' }],
        escalation: 'multi-level',
        escalationTarget: 'Group HR Head',
        slaHours: 24,
      },
    ],
  },
  {
    id: 'ins-9005',
    title: 'Attendance change — March shift correction',
    transactionType: 'Attendance Change',
    requester: 'Ravi Naik',
    company: 'Aurora Foods',
    department: 'Operations',
    location: 'Chennai',
    definitionName: 'Attendance Change — Standard',
    definitionVersion: 1,
    status: 'in-progress',
    startedAt: '2026-06-15',
    completedAt: null,
    currentStageIndex: 0,
    stages: [
      {
        id: 'st-1',
        name: 'Payroll Review',
        pattern: 'sequential',
        status: 'in-progress',
        approvals: [{ approver: 'Ananya Sharma', decision: 'pending' }],
        escalation: 'multi-level',
        escalationTarget: 'Finance Controller',
        slaHours: 8,
      },
    ],
  },
  {
    id: 'ins-9006',
    title: 'WFH — 3 days (school event)',
    transactionType: 'Work From Home',
    requester: 'Tanvi Kapoor',
    company: 'Aurora Fresh Retail',
    department: 'Sales',
    location: 'Pune',
    definitionName: 'WFH Approval — Retail',
    definitionVersion: 1,
    status: 'in-progress',
    startedAt: '2026-06-26',
    completedAt: null,
    currentStageIndex: 0,
    stages: [
      {
        id: 'st-1',
        name: 'Store Manager Review',
        pattern: 'sequential',
        status: 'in-progress',
        approvals: [{ approver: 'Meera Iyer', decision: 'pending' }],
        escalation: 'manager',
        escalationTarget: 'Reporting manager',
        slaHours: 12,
      },
    ],
  },
  {
    id: 'ins-9007',
    title: 'Confirmation — probation complete (J. Torres)',
    transactionType: 'Confirmation',
    requester: 'HR System',
    company: 'Northwind Logistics',
    department: 'Operations',
    location: 'Austin',
    definitionName: 'Confirmation Review — Logistics',
    definitionVersion: 1,
    status: 'in-progress',
    startedAt: '2026-06-12',
    completedAt: null,
    currentStageIndex: 1,
    stages: [
      {
        id: 'st-1',
        name: 'Manager Assessment',
        pattern: 'sequential',
        status: 'approved',
        approvals: [{ approver: 'Vikram Rao', decision: 'approved' }],
        escalation: 'manager',
        escalationTarget: 'Reporting manager',
        slaHours: 48,
      },
      {
        id: 'st-2',
        name: 'HR Panel',
        pattern: 'parallel-any',
        status: 'in-progress',
        approvals: [
          { approver: 'Priya Menon', decision: 'pending' },
          { approver: 'Sunita Patil', decision: 'pending' },
        ],
        escalation: 'role',
        escalationTarget: 'HR Director',
        slaHours: 24,
      },
    ],
  },
  {
    id: 'ins-9008',
    title: 'Layoff — 14 warehouse roles (restructure)',
    transactionType: 'Layoff',
    requester: 'Devika Rao',
    company: 'Zenith Software',
    department: 'Operations',
    location: 'London',
    definitionName: 'Layoff Approval — Zenith',
    definitionVersion: 1,
    status: 'in-progress',
    startedAt: '2026-06-10',
    completedAt: null,
    currentStageIndex: 0,
    stages: [
      {
        id: 'st-1',
        name: 'Leadership Consensus',
        pattern: 'parallel-all',
        status: 'in-progress',
        approvals: [
          { approver: 'Meera Iyer', decision: 'approved' },
          { approver: 'Farhan Ali', decision: 'approved' },
          { approver: 'Sunita Patil', decision: 'pending' },
        ],
        escalation: 'multi-level',
        escalationTarget: 'Group HR Head',
        slaHours: 72,
      },
    ],
  },
  {
    id: 'ins-9009',
    title: 'Leave — bereavement 3 days',
    transactionType: 'Leave Request',
    requester: 'Mohan Das',
    company: 'Aurora Foods',
    department: 'Finance',
    location: 'Hyderabad',
    // Bound to v1 even though v2 is now active — version binding (WFE-20).
    definitionName: 'Leave Approval — Standard',
    definitionVersion: 1,
    status: 'approved',
    startedAt: '2026-03-02',
    completedAt: '2026-03-03',
    currentStageIndex: 0,
    stages: [
      {
        id: 'st-1',
        name: 'Manager Review',
        pattern: 'sequential',
        status: 'approved',
        approvals: [{ approver: 'Vikram Rao', decision: 'approved' }],
        escalation: 'manager',
        escalationTarget: 'Reporting manager',
        slaHours: 24,
      },
    ],
  },
  {
    id: 'ins-9010',
    title: 'Expense claim — ₹92,000 offsite',
    transactionType: 'Expense Claim',
    requester: 'Sneha Joshi',
    company: 'Aurora Foods',
    department: 'Sales',
    location: 'Pune',
    definitionName: 'Expense Claim — Under ₹50k',
    definitionVersion: 1,
    status: 'rejected',
    startedAt: '2026-05-20',
    completedAt: '2026-05-21',
    currentStageIndex: 0,
    stages: [
      {
        id: 'st-1',
        name: 'Finance Desk',
        pattern: 'parallel-any',
        status: 'rejected',
        approvals: [
          { approver: 'Farhan Ali', decision: 'rejected' },
          { approver: 'David Kim', decision: 'closed' },
          { approver: 'Ananya Sharma', decision: 'closed' },
        ],
        escalation: 'role',
        escalationTarget: 'Finance Controller',
        slaHours: 24,
      },
    ],
  },
]

export const seedTasks: ApprovalTask[] = [
  {
    id: 'tsk-501',
    instanceId: 'ins-9001',
    stageId: 'st-1',
    stageName: 'Manager Review',
    pattern: 'sequential',
    approver: 'Vikram Rao',
    status: 'pending',
    via: 'normal',
    slaPercent: 55,
    slaHours: 16,
    assignedAt: '2026-06-24',
    decidedAt: null,
    escalatedFrom: null,
  },
  {
    id: 'tsk-502',
    instanceId: 'ins-9002',
    stageId: 'st-1',
    stageName: 'Supervisor Review',
    pattern: 'sequential',
    approver: 'Ananya Sharma',
    status: 'pending',
    via: 'time-reassignment',
    slaPercent: 80,
    slaHours: 8,
    assignedAt: '2026-06-25',
    decidedAt: null,
    escalatedFrom: 'Rohit Verma',
  },
  {
    id: 'tsk-503',
    instanceId: 'ins-9003',
    stageId: 'st-1',
    stageName: 'Finance Desk',
    pattern: 'parallel-any',
    approver: 'Farhan Ali',
    status: 'pending',
    via: 'normal',
    slaPercent: 40,
    slaHours: 24,
    assignedAt: '2026-06-25',
    decidedAt: null,
    escalatedFrom: null,
  },
  {
    id: 'tsk-504',
    instanceId: 'ins-9003',
    stageId: 'st-1',
    stageName: 'Finance Desk',
    pattern: 'parallel-any',
    approver: 'David Kim',
    status: 'pending',
    via: 'normal',
    slaPercent: 40,
    slaHours: 24,
    assignedAt: '2026-06-25',
    decidedAt: null,
    escalatedFrom: null,
  },
  {
    id: 'tsk-505',
    instanceId: 'ins-9003',
    stageId: 'st-1',
    stageName: 'Finance Desk',
    pattern: 'parallel-any',
    approver: 'Ananya Sharma',
    status: 'pending',
    via: 'normal',
    slaPercent: 40,
    slaHours: 24,
    assignedAt: '2026-06-25',
    decidedAt: null,
    escalatedFrom: null,
  },
  {
    id: 'tsk-506',
    instanceId: 'ins-9004',
    stageId: 'st-2',
    stageName: 'Clearance Panel',
    pattern: 'parallel-all',
    approver: 'Farhan Ali',
    status: 'pending',
    via: 'normal',
    slaPercent: 60,
    slaHours: 40,
    assignedAt: '2026-06-20',
    decidedAt: null,
    escalatedFrom: null,
  },
  {
    id: 'tsk-507',
    instanceId: 'ins-9004',
    stageId: 'st-2',
    stageName: 'Clearance Panel',
    pattern: 'parallel-all',
    approver: 'Elena Garcia',
    status: 'pending',
    via: 'normal',
    slaPercent: 60,
    slaHours: 40,
    assignedAt: '2026-06-20',
    decidedAt: null,
    escalatedFrom: null,
  },
  {
    id: 'tsk-508',
    instanceId: 'ins-9005',
    stageId: 'st-1',
    stageName: 'Payroll Review',
    pattern: 'sequential',
    approver: 'Ananya Sharma',
    status: 'pending',
    via: 'multi-level',
    slaPercent: 110,
    slaHours: 8,
    assignedAt: '2026-06-17',
    decidedAt: null,
    escalatedFrom: 'David Kim',
  },
  {
    id: 'tsk-509',
    instanceId: 'ins-9006',
    stageId: 'st-1',
    stageName: 'Store Manager Review',
    pattern: 'sequential',
    approver: 'Meera Iyer',
    status: 'pending',
    via: 'normal',
    slaPercent: 30,
    slaHours: 12,
    assignedAt: '2026-06-26',
    decidedAt: null,
    escalatedFrom: null,
  },
  {
    id: 'tsk-510',
    instanceId: 'ins-9007',
    stageId: 'st-2',
    stageName: 'HR Panel',
    pattern: 'parallel-any',
    approver: 'Priya Menon',
    status: 'pending',
    via: 'normal',
    slaPercent: 85,
    slaHours: 24,
    assignedAt: '2026-06-22',
    decidedAt: null,
    escalatedFrom: null,
  },
  {
    id: 'tsk-511',
    instanceId: 'ins-9007',
    stageId: 'st-2',
    stageName: 'HR Panel',
    pattern: 'parallel-any',
    approver: 'Sunita Patil',
    status: 'pending',
    via: 'normal',
    slaPercent: 85,
    slaHours: 24,
    assignedAt: '2026-06-22',
    decidedAt: null,
    escalatedFrom: null,
  },
  {
    id: 'tsk-512',
    instanceId: 'ins-9008',
    stageId: 'st-1',
    stageName: 'Leadership Consensus',
    pattern: 'parallel-all',
    approver: 'Sunita Patil',
    status: 'pending',
    via: 'normal',
    slaPercent: 95,
    slaHours: 72,
    assignedAt: '2026-06-10',
    decidedAt: null,
    escalatedFrom: null,
  },
  {
    id: 'tsk-513',
    instanceId: 'ins-9009',
    stageId: 'st-1',
    stageName: 'Manager Review',
    pattern: 'sequential',
    approver: 'Vikram Rao',
    status: 'approved',
    via: 'normal',
    slaPercent: 35,
    slaHours: 24,
    assignedAt: '2026-03-02',
    decidedAt: '2026-03-03',
    escalatedFrom: null,
  },
  {
    id: 'tsk-514',
    instanceId: 'ins-9010',
    stageId: 'st-1',
    stageName: 'Finance Desk',
    pattern: 'parallel-any',
    approver: 'Farhan Ali',
    status: 'rejected',
    via: 'normal',
    slaPercent: 20,
    slaHours: 24,
    assignedAt: '2026-05-20',
    decidedAt: '2026-05-21',
    escalatedFrom: null,
  },
]
