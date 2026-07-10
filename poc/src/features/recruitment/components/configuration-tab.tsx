import { SettingsWorkspace } from '@/components/common/settings/settings-workspace'
import { useAssessment } from '../hooks/use-assessment'
import { useCompensation } from '../hooks/use-compensation'
import type { RecruitmentConfigStore } from '../hooks/use-recruitment-config'
import { useRecruitmentSettingGroups } from './settings-groups'

/**
 * Recruitment configuration workspace — 7 visual groups replacing the flat
 * tab list (TA-15, TA-16, TA-25, TA-26, TA-35, TA-37, TA-38, TA-40, TA-41,
 * TA-43, TA-46, TA-48, TA-51…TA-56).
 */
export function ConfigurationTab({
  config,
}: {
  config: RecruitmentConfigStore
}) {
  const compensation = useCompensation()
  const assessment = useAssessment()
  const groups = useRecruitmentSettingGroups({ config, compensation, assessment })
  return <SettingsWorkspace title='Recruitment settings' groups={groups} />
}
