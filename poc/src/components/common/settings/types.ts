import type { ReactNode } from 'react'
import type { Role } from '@/context/role-context'

export type SettingScope = 'platform' | 'group' | 'company'

export interface SettingStatusChip {
  label: string
  tone?: 'neutral' | 'positive' | 'warning' | 'danger'
}

export interface SettingGroup {
  id: string
  title: string
  /** ONE line, plain language */
  description: string
  /** phosphor icon, size 24 */
  icon: ReactNode
  /** max 3 */
  status?: SettingStatusChip[]
  /** default 'company' */
  scope?: SettingScope
  /** omit = all admins; filtered via useRole().hasRole */
  roles?: Role[]
  /** extra search terms */
  keywords?: string[]
  advancedCount?: number
  /** group body — initially wraps existing config-* */
  render: () => ReactNode
}

export interface SettingsWorkspaceProps {
  groups: SettingGroup[]
  title?: string
  defaultGroupId?: string
  onGroupChange?: (id: string | null) => void
}
