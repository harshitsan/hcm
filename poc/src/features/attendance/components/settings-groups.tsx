import { useState } from 'react'
import {
  Bell,
  CalendarBlank,
  Gauge,
  Plug,
  Shield,
  UsersThree,
} from 'phosphor-react'
import type { SettingGroup } from '@/components/common/settings/types'
import { StatusDonut } from '@/components/common/settings/settings-group-card'
import { AdvancedSection } from '@/components/common/settings/advanced-section'
import {
  RulePillBuilder,
  type Rule,
  type RuleAttribute,
} from '@/components/common/settings/rule-pill-builder'
import { CalendarPreview } from '@/components/common/settings/calendar-preview'
import { EngineArtifactsPanel } from '@/features/workflows/components/engine-artifacts-panel'
import { useEngineArtifactCounts } from '@/features/workflows/hooks/use-engine-artifact-counts'
import { shortId } from '@/features/leave/data/shared'
import type { AttendanceConfigStore } from '../hooks/use-attendance-config'
import { ConfigAudit } from './config-audit'
import { ConfigHolidays } from './config-holidays'
import { ConfigLimits } from './config-limits'
import { ConfigPolicies } from './config-policies'
import { ConfigTemplates } from './config-templates'
import { ConfigWorkflows } from './config-workflows'

// ── Attribute & outcome definitions ─────────────────────────────────────────
const LIMIT_ATTRIBUTES: RuleAttribute[] = [
  {
    id: 'employee-class',
    label: 'Employee class',
    operators: ['is', 'is not'],
    values: [
      { id: 'Regular', label: 'Regular' },
      { id: 'Probationary', label: 'Probationary' },
      { id: 'Contractor', label: 'Contractor' },
      { id: 'Executive', label: 'Executive' },
      { id: 'All', label: 'All classes' },
    ],
  },
  {
    id: 'request-hours',
    label: 'Hours per request',
    operators: ['≤', '>', '='],
    valueType: 'number',
  },
  {
    id: 'monthly-hours',
    label: 'Monthly hours used',
    operators: ['≤', '>', '='],
    valueType: 'number',
  },
  {
    id: 'monthly-requests',
    label: 'Monthly request count',
    operators: ['≤', '>'],
    valueType: 'number',
  },
  {
    id: 'location-type',
    label: 'Location type',
    operators: ['is', 'is not'],
    values: [
      { id: 'office', label: 'Office' },
      { id: 'wfh', label: 'Work from home' },
      { id: 'field', label: 'Field' },
    ],
  },
  {
    id: 'wfh-enabled',
    label: 'WFH enabled',
    operators: ['is'],
    values: [
      { id: 'true', label: 'Yes' },
      { id: 'false', label: 'No' },
    ],
  },
]

const LIMIT_OUTCOMES = [
  { id: 'auto-approve', label: 'Auto-approve', tone: 'positive' as const },
  { id: 'flag-review', label: 'Flag for review', tone: 'warning' as const },
  { id: 'skip-check', label: 'Skip check', tone: 'neutral' as const },
  { id: 'block', label: 'Block request', tone: 'danger' as const },
]

// ── Session-local rule state (like lifecycleSessionChain) ────────────────────
// Maps outTimeSettings + wfhTemplates into Rule[] for the visual builder.
// On change, the outTimeSettings that ARE expressible (class-specific flag +
// monthly limit) are written back through the store; the pill state captures
// the rule shape for visual continuity.

let attendanceSessionRules: Rule[] | null = null

function buildInitialRules(config: AttendanceConfigStore): Rule[] {
  const rules: Rule[] = []

  // One rule per outTimeSetting capturing class-specificity
  for (const ots of config.outTimeSettings) {
    rules.push({
      id: `ots-rule-${ots.id}`,
      when: [
        {
          attributeId: 'employee-class',
          operator: 'is',
          value: ots.employeeClass,
        },
        {
          attributeId: 'request-hours',
          operator: '>',
          value: String(ots.maxHoursPerRequest),
        },
      ],
      outcomeId: 'flag-review',
      enabled: true,
    })
  }

  // One rule per wfhTemplate capturing WFH monthly limit
  for (const wft of config.wfhTemplates) {
    rules.push({
      id: `wft-rule-${wft.id}`,
      when: [
        {
          attributeId: 'wfh-enabled',
          operator: 'is',
          value: String(config.wfhEnabled),
        },
        {
          attributeId: 'monthly-requests',
          operator: '>',
          value: String(wft.maxPerMonth),
        },
      ],
      outcomeId: 'block',
      enabled: config.wfhEnabled,
    })
  }

  // Fallback rule: auto-approve anything within standard limits
  rules.push({
    id: shortId('rule'),
    when: [
      {
        attributeId: 'monthly-hours',
        operator: '≤',
        value: String(config.outTimeSettings[0]?.maxHoursPerMonth ?? 8),
      },
    ],
    outcomeId: 'auto-approve',
    enabled: true,
  })

  return rules
}

// ── Policies & limits group body (RulePillBuilder flagship) ─────────────────

function PoliciesLimitsGroupBody({ config }: { config: AttendanceConfigStore }) {
  const [rules, setRules] = useState<Rule[]>(
    () => attendanceSessionRules ?? buildInitialRules(config)
  )

  const handleRulesChange = (next: Rule[]) => {
    attendanceSessionRules = next
    setRules(next)
    // Write expressible changes back: for each rule originating from an
    // outTimeSetting (id prefix 'ots-rule-'), sync its monthly-requests
    // and request-hours clauses back to the store.
    for (const rule of next) {
      if (rule.id.startsWith('ots-rule-')) {
        const otsId = rule.id.replace('ots-rule-', '')
        const hoursClause = rule.when.find((c) => c.attributeId === 'request-hours')
        const monthlyClause = rule.when.find((c) => c.attributeId === 'monthly-hours')
        const classClause = rule.when.find((c) => c.attributeId === 'employee-class')
        const update: Record<string, unknown> = {}
        if (hoursClause?.value) update.maxHoursPerRequest = Number(hoursClause.value)
        if (monthlyClause?.value) update.maxHoursPerMonth = Number(monthlyClause.value)
        if (classClause?.value) {
          update.classSpecific = classClause.value !== 'All'
          update.employeeClass = classClause.value
        }
        if (Object.keys(update).length > 0) {
          config.updateOutTimeSetting(otsId, update as Parameters<typeof config.updateOutTimeSetting>[1])
        }
      }
    }
  }

  const enabledCount = rules.filter((r) => r.enabled).length

  return (
    <div className='space-y-5'>
      <div>
        <p className='text-paragraph-sm text-neutral-1000 mb-3'>
          Policy rules evaluate each attendance request to determine whether it
          should auto-approve, flag for review, or block based on employee class,
          hours, and WFH limits. Rules are evaluated top-to-bottom; first match wins.
        </p>
        <p className='text-xs text-neutral-1000 mb-4'>
          {enabledCount} of {rules.length} rule{rules.length !== 1 ? 's' : ''} active
        </p>
        <RulePillBuilder
          rules={rules}
          onChange={handleRulesChange}
          attributes={LIMIT_ATTRIBUTES}
          outcomes={LIMIT_OUTCOMES}
          maxRules={12}
        />
      </div>
      <AdvancedSection count={2}>
        <div className='space-y-6'>
          <ConfigLimits config={config} />
          <ConfigPolicies config={config} />
        </div>
      </AdvancedSection>
    </div>
  )
}

// ── Holidays group body (CalendarPreview) ────────────────────────────────────

function HolidaysGroupBody({ config }: { config: AttendanceConfigStore }) {
  const holidays = config.activeCalendar.holidays
  const markers = holidays.map((h) => ({
    date: h.date,
    label: h.name,
    kind: (h.kind === 'optional' ? 'optional' : 'holiday') as 'holiday' | 'optional',
  }))
  // Working days: Mon-Fri (1-5); Saturday/Sunday off per the statutory config
  const weeklyOff = config.activeStatutory.weeklyOffDay
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const offDayNum = DAYS.indexOf(weeklyOff)
  // Standard working days are 1-6, exclude weekly off and Sunday (0)
  const workingDays = [1, 2, 3, 4, 5, 6].filter((d) => d !== offDayNum && d !== 0)

  return (
    <div className='space-y-5'>
      <CalendarPreview
        markers={markers}
        workingDays={workingDays}
        months={3}
      />
      <AdvancedSection count={3}>
        <ConfigHolidays config={config} />
      </AdvancedSection>
    </div>
  )
}

// ── Engine features group ────────────────────────────────────────────────────

function EngineGroup() {
  const { active, total } = useEngineArtifactCounts('Time & Attendance')
  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-2'>
        <StatusDonut value={active} total={total} />
        <span className='text-paragraph-sm text-neutral-1000'>
          {active} of {total} active
        </span>
      </div>
      <EngineArtifactsPanel module='Time & Attendance' />
    </div>
  )
}

// ── Group definitions ────────────────────────────────────────────────────────

/** Returns the 6 SettingGroup definitions for the Attendance admin SettingsWorkspace. */
export function useAttendanceSettingGroups(
  config: AttendanceConfigStore
): SettingGroup[] {
  // Status chip derivations
  const activeRulesCount = (attendanceSessionRules ?? buildInitialRules(config)).filter(
    (r) => r.enabled
  ).length
  const holidayCount = config.activeCalendar.holidays.length
  const workflowCount = config.workflows.filter((w) => w.status === 'active').length
  const templateCount = config.templates.length
  const auditEnabled = config.auditSettings.auditEnabled
  const auditorGroupCount = config.auditorsGroups.length

  return [
    {
      id: 'att-policies-limits',
      title: 'Policies & limits',
      description:
        'Request rules engine — define auto-approve, flag, skip and block outcomes per employee class, hours and WFH limits.',
      icon: <Gauge size={24} />,
      keywords: [
        'policy',
        'limit',
        'out-time',
        'WFH',
        'work from home',
        'rule',
        'auto-approve',
        'block',
        'flag',
        'comp-off',
        'flexi',
        'break',
        'employee class',
      ],
      status: [
        {
          label: `${activeRulesCount} rule${activeRulesCount !== 1 ? 's' : ''} active`,
          tone: activeRulesCount > 0 ? 'positive' : 'neutral',
        },
        {
          label: config.wfhEnabled ? 'WFH on' : 'WFH off',
          tone: config.wfhEnabled ? 'positive' : 'neutral',
        },
      ],
      render: () => <PoliciesLimitsGroupBody config={config} />,
    },
    {
      id: 'att-holidays',
      title: 'Holidays',
      description:
        'Holiday calendar with mandatory and optional holidays, statutory working hours and version history.',
      icon: <CalendarBlank size={24} />,
      keywords: [
        'holiday',
        'calendar',
        'statutory',
        'working hours',
        'weekly off',
        'optional',
        'mandatory',
        'version',
        'effective',
      ],
      status: [
        {
          label: `${holidayCount} holiday${holidayCount !== 1 ? 's' : ''}`,
          tone: 'neutral',
        },
        {
          label: `${config.activeStatutory.dailyHours}h / day`,
          tone: 'neutral',
        },
      ],
      render: () => <HolidaysGroupBody config={config} />,
    },
    {
      id: 'att-workflows',
      title: 'Workflows & approvals',
      description:
        'Approval flows, escalation rules and recurring audit patterns for corrections, overtime, WFH, comp off and shift swaps.',
      icon: <UsersThree size={24} />,
      keywords: [
        'workflow',
        'approver',
        'approval',
        'escalation',
        'SLA',
        'correction',
        'overtime',
        'shift swap',
        'comp off',
        'payroll cutoff',
        'audit recurrence',
      ],
      status: [
        {
          label: `${workflowCount} config${workflowCount !== 1 ? 's' : ''} active`,
          tone: workflowCount > 0 ? 'positive' : 'neutral',
        },
      ],
      render: () => <ConfigWorkflows config={config} />,
    },
    {
      id: 'att-notifications',
      title: 'Notifications & templates',
      description:
        'Email and in-app notification templates for attendance events — correction, overtime, WFH, comp off and audit.',
      icon: <Bell size={24} />,
      keywords: [
        'notification',
        'template',
        'email',
        'in-app',
        'approval',
        'rejection',
        'reminder',
        'alert',
        'audit',
        'escalation',
      ],
      status: [
        {
          label: `${templateCount} template${templateCount !== 1 ? 's' : ''}`,
          tone: 'neutral',
        },
      ],
      render: () => <ConfigTemplates config={config} />,
    },
    {
      id: 'att-audit',
      title: 'Audit',
      description:
        'Attendance audit configuration — sampling method, habitual-violator thresholds, auditor panels per location.',
      icon: <Shield size={24} />,
      keywords: [
        'audit',
        'sampling',
        'habitual',
        'violator',
        'auditors',
        'panel',
        'location',
        'reschedule',
        'reprimand',
      ],
      status: [
        {
          label: auditEnabled ? 'Audit on' : 'Audit off',
          tone: auditEnabled ? 'positive' : 'neutral',
        },
        {
          label: `${auditorGroupCount} panel${auditorGroupCount !== 1 ? 's' : ''}`,
          tone: 'neutral',
        },
      ],
      render: () => <ConfigAudit config={config} />,
    },
    {
      id: 'att-engine',
      title: 'Engine features',
      description:
        'Workflow Engine workflows targeting Time & Attendance — toggle per scope level.',
      icon: <Plug size={24} />,
      keywords: [
        'engine',
        'artifact',
        'workflow',
        'rule',
        'toggle',
        'scope',
        'business logic',
      ],
      render: () => <EngineGroup />,
    },
  ]
}
