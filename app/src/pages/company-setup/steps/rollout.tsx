/**
 * Phase C — Rollout: bring in people, provision access & onboarding, distribute
 * policies, go live. Steps 11–14 — done after structure & rules exist.
 */
import { Upload, CheckCircle2, Users, Building2, FileText, GitBranch } from 'lucide-react'
import { Badge, Button, Field, Select, Switch, Input, useToast } from '../../../components/ui'
import {
  ROLE_CATALOG, REMINDER_CADENCES, rid,
  type Person,
} from '../model'
import { ChipMultiSelect, RowList, SectionTitle, type Col, type StepProps } from '../shared'

/** Policy pool to push for acknowledgment (selected ones come from the template). */
const POLICY_CATALOG = [
  'Code of Conduct', 'Leave Policy', 'IT Acceptable Use', 'Safety & PPE Policy',
  'Shift Policy', 'Store Cash Handling', 'Uniform Policy', 'PTO Policy',
  'Anti-Harassment (POSH)', 'Data Privacy', 'Travel & Expense', 'Remote Work',
]

/* ----------------------------------------------------------------- 11 · people */
export function PeopleStep({ state, update }: StepProps) {
  const { push } = useToast()
  const deptNames = ['—', ...state.departments.map((d) => d.name).filter(Boolean)]
  const locNames = ['—', ...state.locations.map((l) => l.name).filter(Boolean)]
  const managerNames = ['—', ...state.people.map((p) => p.name).filter(Boolean)]

  const cols: Col<Person>[] = [
    { key: 'name', label: 'Name', placeholder: 'Full name' },
    { key: 'email', label: 'Work email', placeholder: 'name@company.com' },
    { key: 'dept', label: 'Department', type: 'select', options: deptNames },
    { key: 'position', label: 'Position', placeholder: 'Title' },
    { key: 'manager', label: 'Manager', type: 'select', options: managerNames },
    { key: 'location', label: 'Location', type: 'select', options: locNames },
  ]
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <SectionTitle hint="Add people now that structure and rules exist, then set the manager hierarchy.">People</SectionTitle>
        <Button variant="outline" size="sm" onClick={() => push({ title: 'Bulk import — drop a CSV/XLSX to map columns', tone: 'info' })}>
          <Upload className="h-4 w-4" /> Bulk import
        </Button>
      </div>
      <RowList
        rows={state.people}
        cols={cols}
        onChange={(people) => update({ people })}
        makeRow={(): Person => ({ id: rid('pe'), name: '', email: '', dept: deptNames[1] ?? '—', position: '', manager: '—', location: locNames[1] ?? '—' })}
        addLabel="Add person"
        empty="No people yet — bulk-import or add them one by one."
      />
    </div>
  )
}

/* ----------------------------------------------------------------- 12 · provision */
export function ProvisionStep({ state, update }: StepProps) {
  return (
    <div className="space-y-5">
      <SectionTitle hint="Assign roles to the people you imported and kick off their onboarding checklists.">Provision access & onboarding</SectionTitle>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Default role for imported people" hint="Individuals can be promoted to People Manager later.">
          <Select value={state.defaultRole} onChange={(e) => update({ defaultRole: e.target.value })}>
            {ROLE_CATALOG.map((r) => <option key={r}>{r}</option>)}
          </Select>
        </Field>
        <div className="flex items-end pb-1">
          <Switch
            checked={state.kickoffOnboarding}
            onChange={(kickoffOnboarding) => update({ kickoffOnboarding })}
            label="Trigger onboarding checklist on provisioning"
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface2/50 p-4 text-sm text-muted-fg">
        <p className="font-semibold text-fg">What happens on go-live</p>
        <ul className="mt-2 space-y-1.5">
          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> {state.people.length} {state.people.length === 1 ? 'person' : 'people'} get a <strong>{state.defaultRole}</strong> login (managers auto-detected from the hierarchy).</li>
          <li className="flex items-center gap-2">
            {state.kickoffOnboarding
              ? <><CheckCircle2 className="h-4 w-4 text-success" /> Onboarding checklists are created and assigned.</>
              : <><CheckCircle2 className="h-4 w-4 text-muted-fg/50" /> Onboarding checklists are <strong>not</strong> auto-created.</>}
          </li>
          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> Welcome notifications fire via your templates.</li>
        </ul>
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------- 13 · distribute */
export function DistributeStep({ state, update }: StepProps) {
  const toggle = (p: string) =>
    update({
      distributePolicies: state.distributePolicies.includes(p)
        ? state.distributePolicies.filter((x) => x !== p)
        : [...state.distributePolicies, p],
    })
  const options = [...new Set([...POLICY_CATALOG, ...state.distributePolicies])]

  return (
    <div className="space-y-5">
      <SectionTitle hint="Push policies to employees for acknowledgment, with a deadline and reminders.">Distribute policies</SectionTitle>
      <Field label="Policies to acknowledge">
        <ChipMultiSelect options={options} selected={state.distributePolicies} onToggle={toggle} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Acknowledgment deadline (days)">
          <Input
            type="number"
            value={String(state.ackDeadlineDays)}
            onChange={(e) => update({ ackDeadlineDays: Number(e.target.value) })}
            className="w-28"
          />
        </Field>
        <Field label="Reminder cadence">
          <Select value={state.reminderCadence} onChange={(e) => update({ reminderCadence: e.target.value })}>
            {REMINDER_CADENCES.map((c) => <option key={c}>{c}</option>)}
          </Select>
        </Field>
      </div>
      <div className="rounded-lg bg-primary/5 px-4 py-3 text-[13px] text-muted-fg">
        <strong className="text-fg">{state.distributePolicies.length}</strong> {state.distributePolicies.length === 1 ? 'policy' : 'policies'} will be sent for acknowledgment, due in <strong className="text-fg">{state.ackDeadlineDays} days</strong>, reminders <strong className="text-fg">{state.reminderCadence.toLowerCase()}</strong>.
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------- 14 · go live */
export function GoLiveStep({ state }: StepProps) {
  const stats = [
    { icon: Building2, label: 'Locations', value: state.locations.length },
    { icon: Users, label: 'Departments', value: state.departments.length },
    { icon: Users, label: 'People', value: state.people.length },
    { icon: FileText, label: 'Policies', value: state.leaveTypes.length + state.attendanceRules.length },
    { icon: GitBranch, label: 'Workflows', value: state.workflows.length },
    { icon: FileText, label: 'Templates', value: state.templates.length },
  ]
  const rows: [string, string][] = [
    ['Legal name', state.legalName || '—'],
    ['Trade name', state.tradeName || '—'],
    ['Registration', `${state.regType} · ${state.regNumber || '—'}`],
    ['Jurisdictions', state.jurisdictions.join(', ') || '—'],
    ['Currency', state.currency],
    ['Time zone', state.timeZone],
    ['First admin', [state.adminName, state.adminEmail].filter(Boolean).join(' · ') || '—'],
    ['Custom fields', String(state.customFields.length)],
    ['Asset categories', String(state.assetCategories.length)],
    ['Onboarding kickoff', state.kickoffOnboarding ? 'On' : 'Off'],
  ]
  return (
    <div className="space-y-5">
      <SectionTitle hint="Everything is in place. Review, then bring the company online from the button below.">Go live</SectionTitle>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-surface2/40 p-3">
            <div className="flex items-center gap-2 text-muted-fg">
              <s.icon className="h-4 w-4" />
              <span className="text-2xs font-bold uppercase tracking-wide">{s.label}</span>
            </div>
            <p className="mt-1 text-2xl font-extrabold tracking-tight tnum">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <tbody>
            {rows.map(([k, v], i) => (
              <tr key={k} className={i === 0 ? '' : 'border-t border-border'}>
                <th className="w-48 bg-surface2/40 px-4 py-2.5 text-left align-top text-[13px] font-semibold text-muted-fg">{k}</th>
                <td className="px-4 py-2.5 font-semibold">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2 rounded-lg bg-success/8 px-4 py-3 text-sm text-muted-fg">
        <CheckCircle2 className="h-4 w-4 text-success" />
        Ready to launch. <Badge tone="success" dot>All required steps complete</Badge>
      </div>
    </div>
  )
}
