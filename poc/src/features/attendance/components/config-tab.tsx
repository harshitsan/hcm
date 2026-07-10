import { SettingsWorkspace } from '@/components/common/settings/settings-workspace'
import { type AttendanceConfigStore } from '../hooks/use-attendance-config'
import { useAttendanceSettingGroups } from './settings-groups'

/**
 * Versioned, effective-dated Time & Attendance configuration (TNA-24):
 * holidays & statutory hours, break/comp-off/flexi policies, out-time & WFH
 * limits, approval workflows with escalation rules, attendance audit setup
 * and email/notification templates — all per-tenant, applied without a code
 * release. Migrated to SettingsWorkspace (B5) with RulePillBuilder flagship.
 */
export function ConfigTab({ config }: { config: AttendanceConfigStore }) {
  const groups = useAttendanceSettingGroups(config)

  return (
    <SettingsWorkspace
      title='Time & Attendance Settings'
      groups={groups}
    />
  )
}
