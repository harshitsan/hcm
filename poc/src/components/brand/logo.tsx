import { useId } from 'react'
import { cn } from '@/utils/helpers'

/**
 * SatelliteHR brand mark — a core sphere (the organisation) with a tilted
 * orbit ring and a live satellite (every module in one orbit). The satellite
 * animates via the `.shr-orbit` utility; static when reduced motion is set.
 */
export function SatelliteMark({
  size = 32,
  className,
}: {
  size?: number
  className?: string
}) {
  const id = useId()
  return (
    <svg
      viewBox='0 0 48 48'
      width={size}
      height={size}
      fill='none'
      aria-hidden='true'
      className={cn('shrink-0', className)}
    >
      <defs>
        <linearGradient id={`${id}-core`} x1='14' y1='12' x2='34' y2='36'>
          <stop offset='0%' stopColor='#5B8DF6' />
          <stop offset='55%' stopColor='#2E6FF2' />
          <stop offset='100%' stopColor='#1B2659' />
        </linearGradient>
        <linearGradient id={`${id}-sat`} x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0%' stopColor='#FF7A52' />
          <stop offset='100%' stopColor='#F1552F' />
        </linearGradient>
      </defs>

      {/* core sphere */}
      <circle cx='24' cy='24' r='10.5' fill={`url(#${id}-core)`} />
      <circle cx='20' cy='19.5' r='4' fill='#ffffff' opacity='0.28' />

      {/* tilted orbit ring */}
      <ellipse
        cx='24'
        cy='24'
        rx='20'
        ry='8'
        transform='rotate(-24 24 24)'
        stroke='#93B4FA'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeDasharray='2.5 4'
        opacity='0.85'
      />

      {/* orbiting satellite */}
      <g className='shr-orbit' style={{ transformOrigin: '24px 24px' }}>
        <circle cx='24' cy='4.5' r='3.4' fill={`url(#${id}-sat)`} />
        <circle cx='24' cy='4.5' r='5.2' stroke='#FF7A52' strokeWidth='0.8' opacity='0.35' />
      </g>
    </svg>
  )
}

/** Wordmark: "Satellite" in starlight, "HR" in signal flare. */
export function SatelliteWordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'font-display leading-none font-bold tracking-tight',
        className
      )}
    >
      Satellite
      <span className='text-signal-400'>HR</span>
    </span>
  )
}

/** Mark + wordmark lockup for headers and rails. */
export function SatelliteLogo({
  markSize = 28,
  className,
  wordmarkClassName,
}: {
  markSize?: number
  className?: string
  wordmarkClassName?: string
}) {
  return (
    <span className={cn('flex items-center gap-2', className)}>
      <SatelliteMark size={markSize} />
      <SatelliteWordmark className={wordmarkClassName} />
    </span>
  )
}
