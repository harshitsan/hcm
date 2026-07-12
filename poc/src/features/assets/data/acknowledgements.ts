/**
 * Digital receipt/return acknowledgements with condition assessments
 * (ASM-07, ASM-08, ASM-14, ASM-24). Responses are stored against the
 * questionnaire version in effect at capture time.
 */
export type AckType = 'Receipt' | 'Return'

export interface AckResponse {
  fieldId: string
  label: string
  value: string
}

export interface Acknowledgement {
  id: string
  assetId: string
  assetLabel: string
  employeeId: string
  employeeName: string
  type: AckType
  status: 'Pending' | 'Completed'
  raisedOn: string
  completedOn: string | null
  /** Who captured it — the employee, or an admin on behalf (ASM-14). */
  recordedBy: string | null
  onBehalf: boolean
  templateVersion: number
  responses: AckResponse[]
}

export const seedAcknowledgements: Acknowledgement[] = [
  {
    id: 'ack-01', assetId: 'a-02', assetLabel: 'AST-0002 · iPhone 15', employeeId: 'e-01', employeeName: 'Anita Rao', type: 'Receipt', status: 'Pending', raisedOn: '2026-06-20', completedOn: null, recordedBy: null, onBehalf: false, templateVersion: 2, responses: [],
  },
  {
    id: 'ack-02', assetId: 'a-01', assetLabel: 'AST-0001 · MacBook Pro 16"', employeeId: 'e-01', employeeName: 'Anita Rao', type: 'Receipt', status: 'Completed', raisedOn: '2025-03-01', completedOn: '2025-03-02', recordedBy: 'Anita Rao', onBehalf: false, templateVersion: 1,
    responses: [
      { fieldId: 'q-cond', label: 'Overall condition', value: 'Excellent' },
      { fieldId: 'q-damage', label: 'Any visible damage?', value: 'No' },
      { fieldId: 'q-notes', label: 'Notes', value: 'Sealed box, charger included' },
    ],
  },
  {
    id: 'ack-03', assetId: 'a-08', assetLabel: 'AST-0008 · YubiKey 5C Access Key', employeeId: 'e-06', employeeName: 'Nikhil Bose', type: 'Return', status: 'Completed', raisedOn: '2026-06-18', completedOn: '2026-06-18', recordedBy: 'Nikhil Bose', onBehalf: false, templateVersion: 2,
    responses: [
      { fieldId: 'q-cond', label: 'Overall condition', value: 'Good' },
      { fieldId: 'q-damage', label: 'Any visible damage?', value: 'No' },
      { fieldId: 'q-acc', label: 'All accessories present?', value: 'Yes' },
      { fieldId: 'q-notes', label: 'Notes', value: 'Keycap slightly worn' },
    ],
  },
  {
    id: 'ack-04', assetId: 'a-14', assetLabel: 'AST-0014 · Samsung Galaxy S24', employeeId: 'e-02', employeeName: 'Ravi Kumar', type: 'Receipt', status: 'Completed', raisedOn: '2026-03-02', completedOn: '2026-03-02', recordedBy: 'Priya Sharma', onBehalf: true, templateVersion: 1,
    responses: [
      { fieldId: 'q-cond', label: 'Overall condition', value: 'Excellent' },
      { fieldId: 'q-damage', label: 'Any visible damage?', value: 'No' },
      { fieldId: 'q-notes', label: 'Notes', value: 'Recorded on behalf — employee has no system access' },
    ],
  },
  {
    id: 'ack-05', assetId: 'a-07', assetLabel: 'AST-0007 · Epson Projector EB-2250U', employeeId: 'e-04', employeeName: 'Josh Patel', type: 'Receipt', status: 'Pending', raisedOn: '2026-06-10', completedOn: null, recordedBy: null, onBehalf: false, templateVersion: 2, responses: [],
  },
  {
    id: 'ack-06', assetId: 'a-04', assetLabel: 'AST-0004 · ThinkPad X1 Carbon', employeeId: 'e-09', employeeName: 'Karan Mehta', type: 'Return', status: 'Pending', raisedOn: '2026-06-16', completedOn: null, recordedBy: null, onBehalf: false, templateVersion: 2, responses: [],
  },
  {
    id: 'ack-07', assetId: 'a-19', assetLabel: 'AST-0019 · Dell Latitude 7440', employeeId: 'e-01', employeeName: 'Anita Rao', type: 'Return', status: 'Pending', raisedOn: '2026-06-22', completedOn: null, recordedBy: null, onBehalf: false, templateVersion: 2, responses: [],
  },
  {
    id: 'ack-08', assetId: 'a-20', assetLabel: 'AST-0020 · Jabra Evolve2 65 Headset', employeeId: 'e-01', employeeName: 'Anita Rao', type: 'Return', status: 'Completed', raisedOn: '2025-12-15', completedOn: '2025-12-15', recordedBy: 'Anita Rao', onBehalf: false, templateVersion: 2,
    responses: [
      { fieldId: 'q-cond', label: 'Overall condition', value: 'Good' },
      { fieldId: 'q-damage', label: 'Any visible damage?', value: 'No' },
      { fieldId: 'q-acc', label: 'All accessories present?', value: 'Yes' },
      { fieldId: 'q-notes', label: 'Notes', value: 'Ear cushions replaced once' },
    ],
  },
]

export interface WorkflowTask {
  id: string
  workflow: 'Onboarding' | 'Exit'
  employeeId: string
  employeeName: string
  step: string
  assetHint: string
  status: 'Pending' | 'Completed' | 'Blocked'
  linkedTxn: string | null
  dueDate: string
}

/** Asset steps instantiated by the workflow engine (ASM-09, ASM-25). */
export const seedWorkflowTasks: WorkflowTask[] = [
  { id: 'wf-01', workflow: 'Onboarding', employeeId: 'e-10', employeeName: 'Grace Lin', step: 'Issue laptop', assetHint: 'IT Equipment', status: 'Pending', linkedTxn: null, dueDate: '2026-07-06' },
  { id: 'wf-05', workflow: 'Onboarding', employeeId: 'e-10', employeeName: 'Grace Lin', step: 'Issue access card', assetHint: 'Security & Access', status: 'Completed', linkedTxn: 'Issue AST-0021 · 22 Jun 2026', dueDate: '2026-06-22' },
  { id: 'wf-02', workflow: 'Onboarding', employeeId: 'e-01', employeeName: 'Anita Rao', step: 'Issue laptop', assetHint: 'IT Equipment', status: 'Completed', linkedTxn: 'Issue AST-0001 · 01 Mar 2025', dueDate: '2025-03-05' },
  { id: 'wf-03', workflow: 'Exit', employeeId: 'e-09', employeeName: 'Karan Mehta', step: 'Recover all outstanding assets', assetHint: 'AST-0004 outstanding', status: 'Blocked', linkedTxn: null, dueDate: '2026-06-30' },
  { id: 'wf-04', workflow: 'Exit', employeeId: 'e-09', employeeName: 'Karan Mehta', step: 'Revoke access credentials', assetHint: 'Security & Access', status: 'Completed', linkedTxn: 'Recovery of access card · 12 Jun 2026', dueDate: '2026-06-20' },
]
