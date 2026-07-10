import { SettingsWorkspace } from '@/components/common/settings/settings-workspace'
import type { KnowledgeTransferStore } from '../hooks/use-knowledge-transfer'
import type { LifecycleConfigStore } from '../hooks/use-lifecycle-config'
import { useLifecycleSettingGroups } from './settings-groups'

interface ConfigTabProps {
  config: LifecycleConfigStore
  kt: KnowledgeTransferStore
}

/** Lifecycle admin configuration hub — migrated to 7 visual groups. */
export function ConfigTab({ config, kt }: ConfigTabProps) {
  const groups = useLifecycleSettingGroups({ config, kt })
  return <SettingsWorkspace title='Lifecycle settings' groups={groups} />
}
