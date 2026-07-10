import { SettingsWorkspace } from '@/components/common/settings/settings-workspace'
import { RoleGate, useRole } from '@/context/role-context'
import type { KnowledgeTransferStore } from '../hooks/use-knowledge-transfer'
import type { LifecycleConfigStore } from '../hooks/use-lifecycle-config'
import { useLifecycleSettingGroups } from './settings-groups'
import { SectionCard } from './config-widgets'

interface ConfigTabProps {
  config: LifecycleConfigStore
  kt: KnowledgeTransferStore
}

function GroupCompanyAdminBanner() {
  const { role } = useRole()
  return (
    <RoleGate roles={['Group Company Admin']}>
      <SectionCard
        title='Group configuration standards'
        description='Settings governed here apply consistently across the companies in your group; company admins inherit these standards.'
      >
        <p className='text-neutral-1000 text-xs'>
          Viewing as {role}: Aurora Software India, Aurora Software US and
          Helix Manufacturing follow the shared lifecycle configuration
          below.
        </p>
      </SectionCard>
    </RoleGate>
  )
}

/** Lifecycle admin configuration hub — migrated to 7 visual groups. */
export function ConfigTab({ config, kt }: ConfigTabProps) {
  const groups = useLifecycleSettingGroups({ config, kt })
  return (
    <div className='w-full space-y-4'>
      <GroupCompanyAdminBanner />
      <SettingsWorkspace title='Lifecycle settings' groups={groups} />
    </div>
  )
}
