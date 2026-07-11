import { SettingsWorkspace } from '@/components/common/settings/settings-workspace'
import { type BalancesStore } from '../hooks/use-balances'
import { type GlobalSettingsStore } from '../hooks/use-global-settings'
import { type LeaveConfigStore } from '../hooks/use-leave-config'
import { type LeaveSettingsStore } from '../hooks/use-leave-settings'
import { useLeaveSettingGroups } from './settings-groups'

interface ConfigTabProps {
  config: LeaveConfigStore
  settings: LeaveSettingsStore
  globalSettings: GlobalSettingsStore
  balances: BalancesStore
}

/** Company Admin configuration hub — 10 config tabs migrated to 7 visual groups. */
export function ConfigTab({
  config,
  settings,
  globalSettings,
  balances,
}: ConfigTabProps) {
  const groups = useLeaveSettingGroups({
    config,
    settings,
    globalSettings,
    balances,
  })
  return <SettingsWorkspace title='Leave settings' groups={groups} />
}
