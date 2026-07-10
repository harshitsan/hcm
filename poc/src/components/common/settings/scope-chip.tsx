import { Badge } from '@/components/ui/badge'
import type { SettingScope } from './types'

interface ScopeChipProps {
  scope: SettingScope
}

const SCOPE_CONFIG: Record<SettingScope, { emoji: string; label: string; className: string }> = {
  platform: {
    emoji: '🌐',
    label: 'PLATFORM',
    className:
      'bg-purple-100 text-purple-700 border-purple-200 rounded-[6px] text-xs font-medium',
  },
  group: {
    emoji: '🏬',
    label: 'GROUP',
    className:
      'bg-blue-100 text-blue-700 border-blue-200 rounded-[6px] text-xs font-medium',
  },
  company: {
    emoji: '🏢',
    label: 'COMPANY',
    className:
      'bg-neutral-100 text-neutral-700 border-neutral-200 rounded-[6px] text-xs font-medium',
  },
}

export function ScopeChip({ scope }: ScopeChipProps) {
  const { emoji, label, className } = SCOPE_CONFIG[scope]
  return (
    <Badge variant='outline' className={className}>
      {emoji} {label}
    </Badge>
  )
}
