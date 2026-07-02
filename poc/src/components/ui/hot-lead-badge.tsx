import * as React from 'react'
import { format, parse } from 'date-fns'
import { cn } from '@/utils/helpers'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface VerificationEntry {
  name: string
  date: string
}

function parseVerifiedBy(verifiedBy: string): VerificationEntry[] {
  if (!verifiedBy) return []

  const entries = verifiedBy.split(',').map((entry) => entry.trim())
  const result: VerificationEntry[] = []

  for (const entry of entries) {
    const match = entry.match(/^(.+?)\s+verified on\s+(\d{4}-\d{2}-\d{2})$/)
    if (match) {
      const [, name, dateStr] = match
      try {
        const parsedDate = parse(dateStr, 'yyyy-MM-dd', new Date())
        const formattedDate = format(parsedDate, 'do MMM yyyy')
        result.push({ name: name.trim(), date: formattedDate })
      } catch {
        result.push({ name: name.trim(), date: dateStr })
      }
    }
  }

  return result
}

/**
 * Hot Lead Badge Icon - 8-pointed scalloped badge
 * Filled: badge + checkmark (provided SVG). Hollow: ring + stroke checkmark
 */
function HotLeadBadgeIcon({
  variant,
  size = 12,
  className,
}: {
  variant: 'filled' | 'hollow'
  size?: number
  className?: string
}) {
  // Filled: badge ring + checkmark in one path (14x14)
  const filledPath =
    'M13.1163 5.42625C12.8806 5.18 12.6369 4.92625 12.545 4.70312C12.46 4.49875 12.455 4.16 12.45 3.83187C12.4406 3.22187 12.4306 2.53062 11.95 2.05C11.4694 1.56937 10.7781 1.55937 10.1681 1.55C9.84 1.545 9.50125 1.54 9.29688 1.455C9.07438 1.36312 8.82 1.11937 8.57375 0.88375C8.1425 0.469375 7.6525 0 7 0C6.3475 0 5.85812 0.469375 5.42625 0.88375C5.18 1.11937 4.92625 1.36312 4.70312 1.455C4.5 1.54 4.16 1.545 3.83187 1.55C3.22187 1.55937 2.53062 1.56937 2.05 2.05C1.56937 2.53062 1.5625 3.22187 1.55 3.83187C1.545 4.16 1.54 4.49875 1.455 4.70312C1.36312 4.92562 1.11937 5.18 0.88375 5.42625C0.469375 5.8575 0 6.3475 0 7C0 7.6525 0.469375 8.14187 0.88375 8.57375C1.11937 8.82 1.36312 9.07375 1.455 9.29688C1.54 9.50125 1.545 9.84 1.55 10.1681C1.55937 10.7781 1.56937 11.4694 2.05 11.95C2.53062 12.4306 3.22187 12.4406 3.83187 12.45C4.16 12.455 4.49875 12.46 4.70312 12.545C4.92562 12.6369 5.18 12.8806 5.42625 13.1163C5.8575 13.5306 6.3475 14 7 14C7.6525 14 8.14187 13.5306 8.57375 13.1163C8.82 12.8806 9.07375 12.6369 9.29688 12.545C9.50125 12.46 9.84 12.455 10.1681 12.45C10.7781 12.4406 11.4694 12.4306 11.95 11.95C12.4306 11.4694 12.4406 10.7781 12.45 10.1681C12.455 9.84 12.46 9.50125 12.545 9.29688C12.6369 9.07438 12.8806 8.82 13.1163 8.57375C13.5306 8.1425 14 7.6525 14 7C14 6.3475 13.5306 5.85812 13.1163 5.42625ZM9.85375 5.85375L6.35375 9.35375C6.30731 9.40024 6.25217 9.43712 6.19147 9.46228C6.13077 9.48744 6.06571 9.50039 6 9.50039C5.93429 9.50039 5.86923 9.48744 5.80853 9.46228C5.74783 9.43712 5.69269 9.40024 5.64625 9.35375L4.14625 7.85375C4.05243 7.75993 3.99972 7.63268 3.99972 7.5C3.99972 7.36732 4.05243 7.24007 4.14625 7.14625C4.24007 7.05243 4.36732 6.99972 4.5 6.99972C4.63268 6.99972 4.75993 7.05243 4.85375 7.14625L6 8.29313L9.14625 5.14625C9.1927 5.09979 9.24786 5.06294 9.30855 5.0378C9.36925 5.01266 9.4343 4.99972 9.5 4.99972C9.5657 4.99972 9.63075 5.01266 9.69145 5.0378C9.75214 5.06294 9.8073 5.09979 9.85375 5.14625C9.90021 5.1927 9.93706 5.24786 9.9622 5.30855C9.98734 5.36925 10.0003 5.4343 10.0003 5.5C10.0003 5.5657 9.98734 5.63075 9.9622 5.69145C9.93706 5.75214 9.90021 5.8073 9.85375 5.85375Z'

  // Hollow: ring only (16x16), no checkmark (pure outline)
  const hollowPath =
    'M14.2969 6.25313C14.0769 6.02375 13.85 5.78688 13.7756 5.6075C13.7094 5.4475 13.7044 5.11812 13.7 4.82812C13.6906 4.20312 13.6788 3.42562 13.1263 2.87375C12.5738 2.32187 11.7969 2.31125 11.1719 2.3C10.8819 2.29562 10.5525 2.29063 10.3925 2.22438C10.2131 2.15 9.97625 1.92312 9.74687 1.70312C9.30437 1.27875 8.75313 0.75 8 0.75C7.24687 0.75 6.69563 1.27875 6.25313 1.70312C6.02375 1.92312 5.78688 2.15 5.6075 2.22438C5.4475 2.29063 5.11812 2.29562 4.82812 2.3C4.20312 2.3125 3.42563 2.32125 2.875 2.875C2.32437 3.42875 2.3125 4.20312 2.3 4.82812C2.29562 5.11812 2.29063 5.4475 2.22438 5.6075C2.15 5.78688 1.92313 6.02375 1.70312 6.25313C1.27875 6.69563 0.75 7.25 0.75 8C0.75 8.75 1.27875 9.30437 1.70312 9.75C1.92313 9.97937 2.15 10.2163 2.22438 10.3956C2.29063 10.5556 2.29562 10.885 2.3 11.175C2.30938 11.8 2.32125 12.5775 2.87375 13.1294C3.42625 13.6813 4.20313 13.6919 4.82813 13.7031C5.11813 13.7075 5.4475 13.7125 5.6075 13.7788C5.78688 13.8531 6.02375 14.08 6.25313 14.3C6.69563 14.7213 7.25 15.25 8 15.25C8.75 15.25 9.30438 14.7212 9.74688 14.2969C9.97625 14.0769 10.2131 13.85 10.3925 13.7756C10.5525 13.7094 10.8819 13.7044 11.1719 13.7C11.7969 13.6906 12.5744 13.6788 13.1263 13.1263C13.6781 12.5738 13.6888 11.7969 13.7 11.1719C13.7044 10.8819 13.7094 10.5525 13.7756 10.3925C13.85 10.2131 14.0769 9.97625 14.2969 9.74687C14.7212 9.30437 15.25 8.75313 15.25 8C15.25 7.24687 14.7212 6.69563 14.2969 6.25313ZM13.2144 8.70875C12.9131 9.02125 12.5719 9.37875 12.3894 9.81875C12.2137 10.2438 12.2069 10.7037 12.2019 11.1494C12.1969 11.4844 12.19 11.9438 12.0675 12.0656C11.945 12.1875 11.4862 12.195 11.1513 12.2C10.7056 12.2069 10.2456 12.2137 9.82063 12.3875C9.38313 12.5694 9.02438 12.9106 8.71063 13.2119C8.48625 13.4275 8.15 13.75 8 13.75C7.85 13.75 7.51375 13.4275 7.29125 13.2144C6.97875 12.9131 6.62125 12.5719 6.18125 12.3894C5.75625 12.2137 5.29625 12.2069 4.85063 12.2019C4.51563 12.1969 4.05625 12.19 3.93438 12.0675C3.8125 11.945 3.805 11.4862 3.8 11.1512C3.79313 10.7056 3.78625 10.2456 3.6125 9.82063C3.43 9.38313 3.08875 9.025 2.7875 8.71062C2.5725 8.48625 2.25 8.15 2.25 8C2.25 7.85 2.5725 7.51375 2.78563 7.29125C3.08688 6.97875 3.42813 6.62125 3.61063 6.18125C3.78625 5.75625 3.79313 5.29625 3.79813 4.85063C3.805 4.51562 3.8125 4.05625 3.9375 3.9375C4.0625 3.81875 4.51875 3.80812 4.85375 3.80312C5.29938 3.79625 5.75938 3.78937 6.18438 3.61562C6.62188 3.43375 6.98063 3.0925 7.29438 2.79125C7.51375 2.5725 7.85 2.25 8 2.25C8.15 2.25 8.48625 2.5725 8.70875 2.78562C9.02125 3.08687 9.37875 3.42813 9.81875 3.61063C10.2438 3.78625 10.7037 3.79313 11.1494 3.79813C11.4844 3.80313 11.9438 3.81 12.0656 3.9325C12.1875 4.055 12.195 4.51375 12.2 4.84875C12.2069 5.29438 12.2137 5.75438 12.3875 6.17938C12.57 6.61688 12.9112 6.975 13.2125 7.28937C13.4256 7.51187 13.7481 7.84813 13.7481 7.99813C13.7481 8.14813 13.4275 8.48625 13.2144 8.70875Z'

  if (variant === 'filled') {
    return (
      <svg
        width={size}
        height={size}
        viewBox='0 0 14 14'
        fill='none'
        className={className}
        aria-hidden
      >
        <path d={filledPath} fill='currentColor' />
      </svg>
    )
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 16 16'
      fill='none'
      className={className}
      aria-hidden
    >
      <path d={hollowPath} fill='currentColor' />
    </svg>
  )
}

export interface HotLeadBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  /** 'filled' = solid icon with white checkmark (1st image), 'hollow' = outline icon (2nd image) */
  variant?: 'filled' | 'hollow'
  /** Verification details string like "Kondal Reddy verified on 2025-12-04, Acer Sales verified on 2026-01-30" */
  verifiedByHover?: string | null
}

export function HotLeadBadge({
  variant = 'filled',
  verifiedByHover,
  className,
  ...props
}: HotLeadBadgeProps) {
  const verificationEntries = React.useMemo(
    () => parseVerifiedBy(verifiedByHover || ''),
    [verifiedByHover]
  )

  const badgeContent = (
    <span
      data-slot='hot-lead-badge'
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
        'bg-[#FFEBE5] text-[#E65338]',
        className
      )}
      {...props}
    >
      <HotLeadBadgeIcon variant={variant} size={12} className='shrink-0' />
      <span>Hot Lead</span>
    </span>
  )

  if (verificationEntries.length === 0) {
    return badgeContent
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
      <TooltipContent side='bottom'>
        <div className='flex flex-col gap-1 normal-case'>
          {verificationEntries.map((entry, index) => (
            <div key={index} className='flex flex-col'>
              <span className='text-sm font-medium'>{entry.name}</span>
              <span className='text-xs opacity-80'>
                Verified on {entry.date}
              </span>
            </div>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
