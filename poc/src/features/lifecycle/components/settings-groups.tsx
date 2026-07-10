import { useState } from 'react'
import {
  BookOpen,
  Briefcase,
  Door,
  Gear,
  Plug,
  UserList,
  UsersThree,
} from 'phosphor-react'
import type { SettingGroup } from '@/components/common/settings/types'
import { StatusDonut } from '@/components/common/settings/settings-group-card'
import {
  ApproverChainEditor,
  type ApproverStep,
} from '@/components/common/settings/approver-chain-editor'
import { AdvancedSection } from '@/components/common/settings/advanced-section'
import { ToggleTile } from '@/components/common/settings/toggle-tile'
import { EngineArtifactsPanel } from '@/features/workflows/components/engine-artifacts-panel'
import { useEngineArtifactCounts } from '@/features/workflows/hooks/use-engine-artifact-counts'
import { RoleGate } from '@/context/role-context'
import type { KnowledgeTransferStore } from '../hooks/use-knowledge-transfer'
import type { LifecycleConfigStore } from '../hooks/use-lifecycle-config'
import { ConfigApprovals } from './config-approvals'
import { ConfigExit } from './config-exit'
import { ConfigExitFlow } from './config-exit-flow'
import { ConfigKt } from './config-kt'
import { ConfigOnboarding } from './config-onboarding'
import { ConfigProbation } from './config-probation'
import { ConfigTemplates } from './config-templates'

export interface LifecycleSettingGroupStores {
  config: LifecycleConfigStore
  kt: KnowledgeTransferStore
}

// ── Engine features group ────────────────────────────────────────────────────

function EngineGroup() {
  const { active, total } = useEngineArtifactCounts('Employee Lifecycle')
  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-2'>
        <StatusDonut value={active} total={total} />
        <span className='text-paragraph-sm text-neutral-1000'>
          {active} of {total} active
        </span>
      </div>
      <EngineArtifactsPanel module='Employee Lifecycle' />
    </div>
  )
}

// ── Approvals group — chain editor on top, existing tables in AdvancedSection ─

/**
 * Session-local chain state persists across group open/close within the
 * session (same pattern as B3 Leave approvals).
 */
let lifecycleSessionChain: ApproverStep[] | null = null

function ApprovalsGroupBody({ config }: { config: LifecycleConfigStore }) {
  const initialSteps: ApproverStep[] = config.approverGraphs
    .flatMap((g) =>
      g.steps.slice(0, 2).map((s) => ({
        id: `${g.id}-${s.order}`,
        label: s.role,
        kind: 'role' as const,
        meta: g.workflow,
      }))
    )
    .slice(0, 5)

  const stepOptions: ApproverStep[] = [
    { id: 'mgr', label: 'Manager', kind: 'role' },
    { id: 'dept', label: 'Department Head', kind: 'role' },
    { id: 'hr', label: 'HR', kind: 'role' },
    { id: 'grp', label: 'Group Admin', kind: 'role' },
  ]

  const [chainState, setChainState] = useState<ApproverStep[]>(
    () => lifecycleSessionChain ?? initialSteps
  )

  const updateChain = (next: ApproverStep[]) => {
    lifecycleSessionChain = next
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
        <ConfigApprovals config={config} />
      </AdvancedSection>
    </div>
  )
}

// ── Group definitions ────────────────────────────────────────────────────────

/** Returns the 7 SettingGroup definitions for the Lifecycle admin SettingsWorkspace. */
export function useLifecycleSettingGroups(
  stores: LifecycleSettingGroupStores
): SettingGroup[] {
  const { config, kt } = stores

  // ── Status chip derivations ──────────────────────────────────────────────
  const templateCount = config.templates.length
  const publishedTemplate = config.templates.find((t) => t.status === 'published')
  const exitTypeCount = config.exitTypes.items.length
  const approverGraphCount = config.approverGraphs.length
  const letterCount = config.letterTemplates.items.length
  const ktEnabled = kt.moduleEnabled

  return [
    {
      id: 'lc-onboarding',
      title: 'Onboarding',
      description:
        'Versioned onboarding task templates, stage definitions and required-document checklists.',
      icon: <UserList size={24} />,
      keywords: ['onboarding', 'task', 'template', 'checklist', 'joiner', 'stage'],
      status: [
        {
          label: `${templateCount} template${templateCount !== 1 ? 's' : ''}`,
          tone: 'neutral',
        },
        {
          label: publishedTemplate
            ? `v${publishedTemplate.version} published`
            : 'Draft',
          tone: publishedTemplate ? 'positive' : 'neutral',
        },
      ],
      render: () => <ConfigOnboarding config={config} />,
    },
    {
      id: 'lc-probation',
      title: 'Probation',
      description:
        'Decision table, scoring thresholds, outcomes and confirmation questionnaire.',
      icon: <Briefcase size={24} />,
      keywords: [
        'probation',
        'confirmation',
        'decision',
        'threshold',
        'outcome',
        'score',
      ],
      status: [
        {
          label: config.settings.confirmationModuleEnabled
            ? 'Module on'
            : 'Module off',
          tone: config.settings.confirmationModuleEnabled ? 'positive' : 'neutral',
        },
        {
          label: `${config.decisionTable.rows.length} criteria`,
          tone: 'neutral',
        },
      ],
      render: () => (
        <div className='space-y-5'>
          <RoleGate roles={['Platform Admin']}>
            <ToggleTile
              icon={<Briefcase size={24} />}
              label='Confirmation Management Module'
              description='When disabled, confirmation, peer review and periodic review screens are not accessible to this tenant.'
              checked={config.settings.confirmationModuleEnabled}
              onCheckedChange={(v) =>
                config.updateSettings(
                  { confirmationModuleEnabled: v },
                  'Confirmation Management Module'
                )
              }
              scope='platform'
            />
          </RoleGate>
          <ConfigProbation config={config} />
        </div>
      ),
    },
    {
      id: 'lc-exit',
      title: 'Exit',
      description:
        'Exit types, clearance chains, notice rules, questionnaire and exit-routing task definitions.',
      icon: <Door size={24} />,
      keywords: [
        'exit',
        'resignation',
        'termination',
        'clearance',
        'notice',
        'questionnaire',
        'layoff',
        'routing',
      ],
      status: [
        {
          label: `${exitTypeCount} exit type${exitTypeCount !== 1 ? 's' : ''}`,
          tone: 'neutral',
        },
        {
          label: config.settings.exitManagementEnabled ? 'Enabled' : 'Disabled',
          tone: config.settings.exitManagementEnabled ? 'positive' : 'neutral',
        },
      ],
      render: () => (
        <div className='space-y-6'>
          <ConfigExit config={config} />
          <ConfigExitFlow config={config} />
        </div>
      ),
    },
    {
      id: 'lc-kt',
      title: 'Knowledge transfer',
      description:
        'KT module toggle, applicable exit types, task-assignment rules and non-exit KT process.',
      icon: <BookOpen size={24} />,
      keywords: ['knowledge transfer', 'KT', 'exit type', 'task', 'handover'],
      status: [
        {
          label: ktEnabled ? 'KT on' : 'KT off',
          tone: ktEnabled ? 'positive' : 'neutral',
        },
      ],
      render: () => (
        <ConfigKt
          store={kt}
          exitTypes={config.exitTypes.items.map((t) => t.name)}
        />
      ),
    },
    {
      id: 'lc-approvals',
      title: 'Approvals',
      description:
        'Approver graphs per workflow, disciplinary location approvers and chain configuration.',
      icon: <UsersThree size={24} />,
      keywords: [
        'approver',
        'graph',
        'workflow',
        'chain',
        'disciplinary',
        'routing',
      ],
      status: [
        {
          label: `${approverGraphCount} graph${approverGraphCount !== 1 ? 's' : ''}`,
          tone: 'neutral',
        },
      ],
      render: () => <ApprovalsGroupBody config={config} />,
    },
    {
      id: 'lc-templates-widgets',
      title: 'Templates & widgets',
      description:
        'Letter templates and communication templates for lifecycle events.',
      icon: <Gear size={24} />,
      keywords: ['template', 'letter', 'widget', 'communication', 'notification'],
      status: [
        {
          label: `${letterCount} letter template${letterCount !== 1 ? 's' : ''}`,
          tone: 'neutral',
        },
      ],
      render: () => <ConfigTemplates config={config} />,
    },
    {
      id: 'lc-engine',
      title: 'Engine features',
      description:
        'Workflow Engine artifacts targeting Employee Lifecycle — toggle per scope level.',
      icon: <Plug size={24} />,
      keywords: ['engine', 'artifact', 'workflow', 'rule', 'toggle', 'scope'],
      render: () => <EngineGroup />,
    },
  ]
}
