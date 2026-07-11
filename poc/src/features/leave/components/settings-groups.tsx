import {
  CalendarBlank,
  Clock,
  Gear,
  GlobeHemisphereWest,
  Plug,
  SunHorizon,
  UsersThree,
} from 'phosphor-react'
import type { SettingGroup } from '@/components/common/settings/types'
import { StatusDonut } from '@/components/common/settings/settings-group-card'
import { EngineArtifactsPanel } from '@/features/workflows/components/engine-artifacts-panel'
import { useEngineArtifactCounts } from '@/features/workflows/hooks/use-engine-artifact-counts'
import type { BalancesStore } from '../hooks/use-balances'
import type { GlobalSettingsStore } from '../hooks/use-global-settings'
import type { LeaveConfigStore } from '../hooks/use-leave-config'
import type { LeaveSettingsStore } from '../hooks/use-leave-settings'
import { ConfigApprovers } from './config-approvers'
import { ConfigCalendar } from './config-calendar'
import { ConfigGeneral } from './config-general'
import { ConfigGlobal } from './config-global'
import { ConfigHolidays } from './config-holidays'
import { ConfigPolicies } from './config-policies'
import { ConfigShifts } from './config-shifts'
import { ConfigTimeOffAdmins } from './config-timeoff-admins'
import { ConfigTypes } from './config-types'
import { ConfigWorkflows } from './config-workflows'
import { YearRolloverCard } from './year-rollover-card'

interface Stores {
  config: LeaveConfigStore
  settings: LeaveSettingsStore
  globalSettings: GlobalSettingsStore
  balances: BalancesStore
}

/** Engine features group body — needs its own component so it can call hooks. */
function EngineGroup() {
  const { active, total } = useEngineArtifactCounts('Leave Management')
  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-2'>
        <StatusDonut value={active} total={total} />
        <span className='text-paragraph-sm text-neutral-1000'>
          {active} of {total} active
        </span>
      </div>
      <EngineArtifactsPanel module='Leave Management' />
    </div>
  )
}

/** Returns the 7 SettingGroup definitions for the Leave admin SettingsWorkspace. */
export function useLeaveSettingGroups(stores: Stores): SettingGroup[] {
  const { config, settings, globalSettings: _g } = stores

  // ── Status chip derivations ────────────────────────────────────────────────
  const typeCount = config.leaveTypes.length
  const policyCount = config.policies.filter((p) => p.status === 'active').length

  // Total approval chain rows across all three mapping kinds
  const chainCount =
    settings.timeOffApprovers.length +
    settings.adjustmentApprovers.length +
    settings.fmlaApprovers.length
  const fmlaOn = settings.fmlaApprovers.length > 0

  // Fixed + optional holidays across all calendars (exclude weekly-off kind)
  const holidayCount = settings.calendars.reduce(
    (sum, cal) =>
      sum +
      cal.holidays.filter((h) => h.kind === 'fixed' || h.kind === 'optional')
        .length,
    0
  )

  const shiftCount = settings.shifts.length

  // ── Groups ─────────────────────────────────────────────────────────────────
  return [
    {
      id: 'leave-types-policies',
      title: 'Leave types & policies',
      description:
        'Define leave categories, accrual rules, and differentiated policy versions.',
      icon: <SunHorizon size={24} />,
      keywords: ['accrual', 'credit', 'carry forward', 'entitlement', 'FMLA'],
      status: [
        { label: `${typeCount} type${typeCount !== 1 ? 's' : ''}`, tone: 'neutral' },
        {
          label: `${policyCount} polic${policyCount !== 1 ? 'ies' : 'y'} active`,
          tone: 'positive',
        },
      ],
      render: () => (
        <div className='space-y-6'>
          <ConfigTypes config={config} />
          <ConfigPolicies config={config} isGroupAdmin={false} />
        </div>
      ),
    },
    {
      id: 'approvals-delegation',
      title: 'Approvals & delegation',
      description:
        'Approver mappings, FMLA chains, time-off admins and delegation windows.',
      icon: <UsersThree size={24} />,
      keywords: [
        'approver',
        'delegate',
        'FMLA',
        'chain',
        'time off admin',
        'adjustment',
      ],
      status: [
        {
          label: `${chainCount} chain${chainCount !== 1 ? 's' : ''}`,
          tone: 'neutral',
        },
        { label: fmlaOn ? 'FMLA on' : 'FMLA off', tone: fmlaOn ? 'positive' : 'neutral' },
      ],
      render: () => (
        <div className='space-y-6'>
          <ConfigApprovers settings={settings} />
          <ConfigWorkflows config={config} />
          <ConfigTimeOffAdmins store={stores.globalSettings} />
        </div>
      ),
    },
    {
      id: 'calendars-holidays',
      title: 'Calendars & holidays',
      description:
        'Holiday calendars, office closures, optional holidays and weekly-off rules.',
      icon: <CalendarBlank size={24} />,
      keywords: [
        'holiday',
        'closure',
        'optional',
        'weekly off',
        'calendar',
        'Mon–Fri',
        'Saturday',
      ],
      status: [
        {
          label: `${holidayCount} holiday${holidayCount !== 1 ? 's' : ''}`,
          tone: 'neutral',
        },
        { label: 'Mon–Fri', tone: 'neutral' },
      ],
      render: () => (
        <div className='space-y-6'>
          <ConfigCalendar settings={settings} onNextStep={() => undefined} />
          <ConfigHolidays settings={settings} />
        </div>
      ),
    },
    {
      id: 'shifts',
      title: 'Shifts',
      description:
        'Define shift timings, flexi hours and tolerance windows for attendance.',
      icon: <Clock size={24} />,
      keywords: ['shift', 'flexi', 'tolerance', 'timing', 'default shift'],
      status: [
        {
          label: `${shiftCount} shift${shiftCount !== 1 ? 's' : ''}`,
          tone: 'neutral',
        },
      ],
      render: () => <ConfigShifts store={settings} />,
    },
    {
      id: 'general-rules',
      title: 'General rules',
      description:
        'Module on/off, employee class accrual start, email/notification templates and the year-end rollover.',
      icon: <Gear size={24} />,
      keywords: [
        'enable',
        'disable',
        'module',
        'template',
        'email',
        'notification',
        'class',
        'accrual start',
        'defaults',
        'rollover',
        'year end',
        'carry forward',
      ],
      status: [{ label: 'Defaults', tone: 'neutral' }],
      render: () => (
        <div className='space-y-6'>
          <ConfigGeneral settings={settings} onNextStep={() => undefined} />
          <YearRolloverCard balances={stores.balances} />
        </div>
      ),
    },
    {
      id: 'global-platform',
      title: 'Global & platform',
      description:
        'Platform-level defaults, tenant catalog and cross-tenant access controls.',
      icon: <GlobeHemisphereWest size={24} />,
      scope: 'platform',
      roles: ['Platform Admin'],
      keywords: ['platform', 'global', 'tenant', 'catalog', 'RLS', 'defaults'],
      render: () => <ConfigGlobal store={stores.globalSettings} />,
    },
    {
      id: 'engine-features',
      title: 'Engine features',
      description:
        'Workflow Engine workflows targeting Leave Management — toggle per scope level.',
      icon: <Plug size={24} />,
      keywords: [
        'engine',
        'artifact',
        'workflow',
        'business logic',
        'rule',
        'toggle',
        'scope',
      ],
      render: () => <EngineGroup />,
    },
  ]
}
