import { useState } from 'react'
import {
  Briefcase,
  Buildings,
  CurrencyDollar,
  Gear,
  Plug,
  ShareNetwork,
  UsersThree,
} from 'phosphor-react'
import type { SettingGroup } from '@/components/common/settings/types'
import { StatusDonut } from '@/components/common/settings/settings-group-card'
import {
  ApproverChainEditor,
  type ApproverStep,
} from '@/components/common/settings/approver-chain-editor'
import { AdvancedSection } from '@/components/common/settings/advanced-section'
import { ToggleTile, ToggleTileGrid } from '@/components/common/settings/toggle-tile'
import { EngineArtifactsPanel } from '@/features/workflows/components/engine-artifacts-panel'
import { useEngineArtifactCounts } from '@/features/workflows/hooks/use-engine-artifact-counts'
import type { AssessmentStore } from '../hooks/use-assessment'
import type { CompensationStore } from '../hooks/use-compensation'
import type { RecruitmentConfigStore } from '../hooks/use-recruitment-config'
import { ConfigApprovals } from './config-approvals'
import { ConfigAssessment } from './config-assessment'
import { ConfigCompensation } from './config-compensation'
import { ConfigHiring } from './config-hiring'
import { ConfigOnboarding } from './config-onboarding'
import { ConfigSetup } from './config-setup'
import { ConfigSourcing } from './config-sourcing'

export interface RecruitmentSettingGroupStores {
  config: RecruitmentConfigStore
  compensation: CompensationStore
  assessment: AssessmentStore
}

// ── Engine features group ────────────────────────────────────────────────────

function EngineGroup() {
  const { active, total } = useEngineArtifactCounts('Recruitment')
  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-2'>
        <StatusDonut value={active} total={total} />
        <span className='text-paragraph-sm text-neutral-1000'>
          {active} of {total} active
        </span>
      </div>
      <EngineArtifactsPanel module='Recruitment' />
    </div>
  )
}

// ── Sourcing channels group — ToggleTile grid on top, ConfigSourcing in Advanced ─

function SourcingGroupBody({ config }: { config: RecruitmentConfigStore }) {
  return (
    <div className='space-y-5'>
      <ToggleTileGrid>
        {config.postingChannels.map((ch) => (
          <ToggleTile
            key={ch.id}
            icon={<ShareNetwork size={24} />}
            label={ch.name}
            description={`${ch.type} · ${ch.postingMode}`}
            checked={ch.active}
            onCheckedChange={() => config.togglePostingChannel(ch.id)}
          />
        ))}
      </ToggleTileGrid>
      <AdvancedSection count={3}>
        <ConfigSourcing config={config} />
      </AdvancedSection>
    </div>
  )
}

// ── Hiring & approvals group — chain editor on top, ConfigApprovals + ConfigHiring ─

/**
 * Session-local chain state persists across group open/close within the
 * session (same pattern as B3 Leave approvals).
 */
let recruitmentSessionChain: ApproverStep[] | null = null

function HiringApprovalsGroupBody({ config }: { config: RecruitmentConfigStore }) {
  const latestGraph = config.approverGraphVersions
    .slice()
    .sort((a, b) => b.version - a.version)[0]

  const initialSteps: ApproverStep[] = latestGraph
    ? [
        {
          id: 'req',
          label: 'Requisition Approver',
          kind: 'role' as const,
          meta: `v${latestGraph.version}`,
        },
        { id: 'hr', label: 'HR Partner', kind: 'role' as const },
        { id: 'offer', label: 'Offer Approver', kind: 'role' as const },
      ]
    : []

  const stepOptions: ApproverStep[] = [
    { id: 'rm', label: 'Reporting Manager', kind: 'role' },
    { id: 'hr', label: 'HR Partner', kind: 'role' },
    { id: 'hm', label: 'Hiring Manager', kind: 'role' },
    { id: 'ta', label: 'TA Lead', kind: 'role' },
    { id: 'dir', label: 'HR Director', kind: 'role' },
  ]

  const [chainState, setChainState] = useState<ApproverStep[]>(
    () => recruitmentSessionChain ?? initialSteps
  )

  const updateChain = (next: ApproverStep[]) => {
    recruitmentSessionChain = next
    setChainState(next)
  }

  return (
    <div className='space-y-5'>
      <ApproverChainEditor
        title='Approval Chain'
        steps={chainState}
        onChange={updateChain}
        stepOptions={stepOptions}
        maxSteps={5}
      />
      <AdvancedSection count={2}>
        <div className='space-y-6'>
          <ConfigApprovals config={config} />
          <ConfigHiring config={config} />
        </div>
      </AdvancedSection>
    </div>
  )
}

// ── Group definitions ────────────────────────────────────────────────────────

/** Returns the 7 SettingGroup definitions for the Recruitment admin SettingsWorkspace. */
export function useRecruitmentSettingGroups(
  stores: RecruitmentSettingGroupStores
): SettingGroup[] {
  const { config, compensation, assessment } = stores

  // ── Status chip derivations ──────────────────────────────────────────────
  const activeChannels = config.postingChannels.filter((c) => c.active).length
  const totalChannels = config.postingChannels.length
  const requisitionRuleCount = config.requisitionApproverRules.length
  const offerRuleCount = config.offerApproverRules.length
  const activeLetterCount = config.letterTemplates.filter((t) => t.active).length
  const moduleOn = config.moduleEnabled

  return [
    {
      id: 'rec-setup',
      title: 'General setup',
      description:
        'Module toggle, pipeline configuration, panel support, paygrade and reference-check settings.',
      icon: <Gear size={24} />,
      keywords: [
        'setup',
        'general',
        'module',
        'pipeline',
        'panel',
        'paygrade',
        'reference',
        'enable',
      ],
      status: [
        {
          label: moduleOn ? 'Module on' : 'Module off',
          tone: moduleOn ? 'positive' : 'neutral',
        },
      ],
      render: () => <ConfigSetup config={config} />,
    },
    {
      id: 'rec-sourcing',
      title: 'Sourcing channels',
      description:
        'Toggle posting channels, vacancy assignment method and post-template configuration.',
      icon: <ShareNetwork size={24} />,
      keywords: [
        'sourcing',
        'channel',
        'job board',
        'social',
        'posting',
        'assignment',
        'round-robin',
      ],
      status: [
        {
          label: `${activeChannels} of ${totalChannels} active`,
          tone: activeChannels > 0 ? 'positive' : 'neutral',
        },
      ],
      render: () => <SourcingGroupBody config={config} />,
    },
    {
      id: 'rec-assessment',
      title: 'Assessments',
      description:
        'Scorecard criteria, interview rounds configuration and pre-interview questions.',
      icon: <Briefcase size={24} />,
      keywords: [
        'assessment',
        'scorecard',
        'criteria',
        'interview',
        'rounds',
        'pre-interview',
      ],
      status: [
        { label: 'Configured', tone: 'neutral' },
      ],
      render: () => <ConfigAssessment store={assessment} />,
    },
    {
      id: 'rec-hiring-approvals',
      title: 'Hiring & approvals',
      description:
        'Approval chain, requisition and offer approver rules, versioned approver graph and letter templates.',
      icon: <UsersThree size={24} />,
      keywords: [
        'approver',
        'hiring',
        'requisition',
        'offer',
        'chain',
        'letter',
        'graph',
        'version',
      ],
      status: [
        {
          label: `${requisitionRuleCount} req rule${requisitionRuleCount !== 1 ? 's' : ''}`,
          tone: 'neutral',
        },
        {
          label: `${offerRuleCount} offer rule${offerRuleCount !== 1 ? 's' : ''}`,
          tone: 'neutral',
        },
        {
          label: `${activeLetterCount} letter${activeLetterCount !== 1 ? 's' : ''} active`,
          tone: activeLetterCount > 0 ? 'positive' : 'neutral',
        },
      ],
      render: () => <HiringApprovalsGroupBody config={config} />,
    },
    {
      id: 'rec-compensation',
      title: 'Compensation',
      description:
        'Pay structures, expense heads and paygrade-to-position level mappings.',
      icon: <CurrencyDollar size={24} />,
      keywords: ['compensation', 'pay', 'paygrade', 'expense', 'band', 'salary'],
      status: [{ label: 'Configured', tone: 'neutral' }],
      render: () => <ConfigCompensation store={compensation} />,
    },
    {
      id: 'rec-onboarding-handoff',
      title: 'Onboarding handoff',
      description:
        'Pre-joining required documents, checklist questions, rehire settings and custom fields.',
      icon: <Buildings size={24} />,
      keywords: [
        'onboarding',
        'pre-joining',
        'documents',
        'checklist',
        'rehire',
        'custom fields',
        'joining',
      ],
      status: [{ label: 'Configured', tone: 'neutral' }],
      render: () => <ConfigOnboarding config={config} />,
    },
    {
      id: 'rec-engine',
      title: 'Engine features',
      description:
        'Workflow Engine workflows targeting Recruitment — toggle per scope level.',
      icon: <Plug size={24} />,
      keywords: ['engine', 'artifact', 'workflow', 'rule', 'toggle', 'scope'],
      render: () => <EngineGroup />,
    },
  ]
}
