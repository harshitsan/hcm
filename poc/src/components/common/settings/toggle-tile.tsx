import { useId, type ReactNode } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ScopeChip } from './scope-chip'
import type { SettingScope } from './types'

export interface ToggleTileProps {
  icon: ReactNode
  label: string
  description?: string
  checked: boolean
  onCheckedChange: (c: boolean) => void
  disabled?: boolean
  scope?: SettingScope
}

export function ToggleTile({
  icon,
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
  scope,
}: ToggleTileProps) {
  const id = useId()

  return (
    <Label
      htmlFor={id}
      className='rounded-[8px] border border-gray-200 bg-white flex items-start gap-3 min-h-[72px] p-3 cursor-pointer'
    >
      <div className='w-9 h-9 flex-shrink-0 bg-neutral-100 rounded-[8px] flex items-center justify-center'>
        {icon}
      </div>
      <div className='flex-1 min-w-0'>
        <p className='text-sm font-medium text-neutral-1400'>{label}</p>
        {description && (
          <p className='text-xs text-neutral-1000 mt-0.5'>{description}</p>
        )}
        {scope && (
          <span className='mt-1 block'>
            <ScopeChip scope={scope} />
          </span>
        )}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className='flex-shrink-0 mt-0.5'
        onClick={(e) => e.stopPropagation()}
      />
    </Label>
  )
}

export function ToggleTileGrid({ children }: { children: ReactNode }) {
  return (
    <div className='grid gap-2 sm:grid-cols-2 lg:grid-cols-3'>{children}</div>
  )
}
