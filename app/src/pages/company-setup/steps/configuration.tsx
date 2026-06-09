/**
 * Phase B — Configuration: access model, policies, workflows, templates, assets.
 * Steps 6–10. This is where the "define a rule → set applicability → attach a
 * workflow → set notifications" composition pattern is authored.
 */
import { Info } from 'lucide-react'
import {
  ROLE_CATALOG, APPLICABILITY, ACCRUALS, WORKFLOW_TRIGGERS, TEMPLATE_KINDS, rid,
  type AccessRow, type LeaveType, type AttendanceRule, type Workflow, type DocTemplate, type AssetCategory,
} from '../model'
import { RowList, SectionTitle, type Col, type StepProps } from '../shared'

/* ----------------------------------------------------------------- 6 · access model */
export function AccessModelStep({ state, update }: StepProps) {
  const cols: Col<AccessRow>[] = [
    { key: 'role', label: 'Role', type: 'select', options: ROLE_CATALOG },
    { key: 'scope', label: 'Scope', placeholder: 'Company / Department / Self' },
    { key: 'assignees', label: 'Who gets it', placeholder: 'HR team, dept heads…' },
  ]
  return (
    <div className="space-y-3">
      <SectionTitle hint="Confirm the roles and who holds them — this gates who can run the remaining steps and what employees see day-to-day.">
        Access model
      </SectionTitle>
      <Note>Roles + applicable policies + self-service settings together shape the whole employee experience. You set it here, not on each screen.</Note>
      <RowList
        rows={state.access}
        cols={cols}
        onChange={(access) => update({ access })}
        makeRow={(): AccessRow => ({ id: rid('ac'), role: 'Employee', scope: 'Self-service', assignees: '' })}
        addLabel="Add role assignment"
      />
    </div>
  )
}

/* ----------------------------------------------------------------- 7 · policies */
export function PoliciesStep({ state, update }: StepProps) {
  const leaveCols: Col<LeaveType>[] = [
    { key: 'name', label: 'Leave type', placeholder: 'Casual Leave' },
    { key: 'days', label: 'Days / yr', type: 'number' },
    { key: 'accrual', label: 'Accrual', type: 'select', options: ACCRUALS },
    { key: 'carryForward', label: 'Carry fwd', type: 'number' },
    { key: 'applicability', label: 'Applies to', type: 'select', options: APPLICABILITY },
  ]
  const ruleCols: Col<AttendanceRule>[] = [
    { key: 'name', label: 'Rule', placeholder: 'Grace period' },
    { key: 'value', label: 'Value', placeholder: '15 min' },
    { key: 'applicability', label: 'Applies to', type: 'select', options: APPLICABILITY },
  ]
  return (
    <div className="space-y-6">
      <div>
        <SectionTitle hint="Each leave type is a versioned, effective-dated rule with an applicability scope.">Leave types & rules</SectionTitle>
        <RowList
          rows={state.leaveTypes}
          cols={leaveCols}
          onChange={(leaveTypes) => update({ leaveTypes })}
          makeRow={(): LeaveType => ({ id: rid('lv'), name: '', days: 0, accrual: 'Monthly', carryForward: 0, applicability: 'Company' })}
          addLabel="Add leave type"
        />
      </div>
      <div>
        <SectionTitle hint="Attendance rules — grace, regularization, overtime — scoped where they apply.">Attendance rules</SectionTitle>
        <RowList
          rows={state.attendanceRules}
          cols={ruleCols}
          onChange={(attendanceRules) => update({ attendanceRules })}
          makeRow={(): AttendanceRule => ({ id: rid('at'), name: '', value: '', applicability: 'Company' })}
          addLabel="Add attendance rule"
        />
      </div>
      <Note>Changes here are versioned and effective-dated — you can revise a policy later without breaking history.</Note>
    </div>
  )
}

/* ----------------------------------------------------------------- 8 · workflows */
export function WorkflowsStep({ state, update }: StepProps) {
  const cols: Col<Workflow>[] = [
    { key: 'name', label: 'Workflow', placeholder: 'Leave approval' },
    { key: 'trigger', label: 'Trigger', type: 'select', options: WORKFLOW_TRIGGERS },
    { key: 'chain', label: 'Approval chain', placeholder: 'Manager → HR' },
    { key: 'sla', label: 'SLA', placeholder: '24h' },
    { key: 'escalation', label: 'Escalation', placeholder: 'HR Head after 48h' },
  ]
  return (
    <div className="space-y-3">
      <SectionTitle hint="Who approves what, in what order. Use → for sequential, + for parallel. Set the SLA and escalation once and every request follows it.">
        Approval workflows
      </SectionTitle>
      <Note>Conditional routing example: a leave request &gt; 5 days can also route to HR. Configure once — every matching request follows it automatically.</Note>
      <RowList
        rows={state.workflows}
        cols={cols}
        onChange={(workflows) => update({ workflows })}
        makeRow={(): Workflow => ({ id: rid('wf'), name: '', trigger: 'Leave', chain: '', sla: '24h', escalation: '' })}
        addLabel="Add workflow"
      />
    </div>
  )
}

/* ----------------------------------------------------------------- 9 · templates */
export function TemplatesStep({ state, update }: StepProps) {
  const cols: Col<DocTemplate>[] = [
    { key: 'name', label: 'Template', placeholder: 'Offer Letter' },
    { key: 'kind', label: 'Kind', type: 'select', options: TEMPLATE_KINDS },
    { key: 'channel', label: 'Channel', placeholder: 'PDF + Email' },
  ]
  return (
    <div className="space-y-3">
      <SectionTitle hint="Letter templates (offer, appointment, relieving) and the notification templates that events fire.">
        Letter & notification templates
      </SectionTitle>
      <RowList
        rows={state.templates}
        cols={cols}
        onChange={(templates) => update({ templates })}
        makeRow={(): DocTemplate => ({ id: rid('tp'), name: '', kind: 'Letter', channel: 'PDF + Email' })}
        addLabel="Add template"
      />
    </div>
  )
}

/* ----------------------------------------------------------------- 10 · assets */
export function AssetsStep({ state, update }: StepProps) {
  const cols: Col<AssetCategory>[] = [
    { key: 'name', label: 'Category', placeholder: 'Laptop' },
    { key: 'tracked', label: 'Track individually', type: 'switch' },
    { key: 'depreciation', label: 'Depreciation', placeholder: '3 yrs SLM' },
  ]
  return (
    <div className="space-y-3">
      <SectionTitle hint="Optional. Define categories if you issue and track assets to employees.">Asset categories</SectionTitle>
      <RowList
        rows={state.assetCategories}
        cols={cols}
        onChange={(assetCategories) => update({ assetCategories })}
        makeRow={(): AssetCategory => ({ id: rid('as'), name: '', tracked: true, depreciation: '' })}
        addLabel="Add category"
        empty="No asset categories — skip this if you don't track assets."
      />
    </div>
  )
}

/* ----------------------------------------------------------------- shared note */
function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-info/8 px-3 py-2.5 text-[13px] text-muted-fg">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" />
      <span>{children}</span>
    </div>
  )
}
