import { CaretRight } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/utils/helpers'
import type { SettingGroup, SettingStatusChip } from './types'

// ─── StatusDonut ────────────────────────────────────────────────────────────

interface StatusDonutProps {
  value: number
  total: number
}

/** 20 px SVG ring showing value/total as a filled arc. */
export function StatusDonut({ value, total }: StatusDonutProps) {
  const SIZE = 20
  const STROKE = 3
  const R = (SIZE - STROKE) / 2
  const CIRCUMFERENCE = 2 * Math.PI * R
  const fraction = total === 0 ? 0 : Math.min(value / total, 1)
  const dash = fraction * CIRCUMFERENCE
  const gap = CIRCUMFERENCE - dash

  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      aria-label={`${value} of ${total}`}
      className='shrink-0'
    >
      {/* Track */}
      <circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={R}
        fill='none'
        stroke='#E5E7EB'
        strokeWidth={STROKE}
      />
      {/* Arc — start at 12 o'clock */}
      <circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={R}
        fill='none'
        stroke='#2563EB'
        strokeWidth={STROKE}
        strokeDasharray={`${dash} ${gap}`}
        strokeLinecap='round'
        transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
      />
    </svg>
  )
}

// ─── Chip tone styles ────────────────────────────────────────────────────────

const TONE_CLASSES: Record<NonNullable<SettingStatusChip['tone']>, string> = {
  neutral: 'bg-neutral-100 text-neutral-700 border-neutral-200',
  positive: 'bg-green-100 text-green-700 border-green-200',
  warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  danger: 'bg-red-100 text-red-700 border-red-200',
}

// ─── SettingsGroupCard ───────────────────────────────────────────────────────

interface SettingsGroupCardProps {
  group: SettingGroup
  onClick: () => void
}

export function SettingsGroupCard({ group, onClick }: SettingsGroupCardProps) {
  const chips = group.status?.slice(0, 3) ?? []

  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'rounded-[8px] border border-gray-200 bg-white',
        'hover:border-blue-700/40 hover:shadow-sm',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600',
        'text-left p-4 min-h-[88px] w-full',
        'flex flex-col gap-2 transition-[border-color,box-shadow] duration-150',
      )}
    >
      {/* Top row: tinted icon + title + caret */}
      <div className='flex items-start gap-3'>
        {/* 40 px tinted icon square */}
        <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-blue-50 text-blue-700'>
          {group.icon}
        </span>

        <div className='min-w-0 flex-1'>
          <p className='text-paragraph-md font-semibold text-neutral-1400 line-clamp-1'>
            {group.title}
          </p>
          <p className='text-paragraph-sm text-neutral-1000 line-clamp-1'>
            {group.description}
          </p>
        </div>

        <CaretRight size={16} className='mt-1 shrink-0 text-neutral-1000' />
      </div>

      {/* Chips row */}
      {chips.length > 0 && (
        <div className='flex flex-wrap gap-1.5'>
          {chips.map((chip) => (
            <Badge
              key={chip.label}
              variant='outline'
              className={cn(
                'rounded-[6px] text-xs font-medium',
                chip.tone ? TONE_CLASSES[chip.tone] : TONE_CLASSES.neutral,
              )}
            >
              {chip.label}
            </Badge>
          ))}
        </div>
      )}
    </button>
  )
}
