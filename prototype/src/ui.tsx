/**
 * Design primitives for the warm cream / charcoal / amber language.
 * Every page composes ONLY from these + charts.tsx — that's what keeps the
 * prototype feeling like one product.
 */
import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { cn, initials } from './lib'

/* ─────────────────────────────────────────────────────────── Card */

export function Card({
  children,
  className,
  glow,
  dark,
  onClick,
}: {
  children: ReactNode
  className?: string
  /** warm amber wash (hero cards) */
  glow?: boolean
  /** charcoal ink card */
  dark?: boolean
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-3xl border shadow-soft',
        dark ? 'ink-card border-transparent text-card' : glow ? 'glow border-line/60' : 'bg-card border-line/80',
        onClick && 'cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lift',
        className,
      )}
    >
      {children}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────── Pill / status badge */

export type PillTone = 'neutral' | 'amber' | 'green' | 'red' | 'ink' | 'outline'

const PILL_TONES: Record<PillTone, string> = {
  neutral: 'bg-card2 text-ink-soft',
  amber: 'bg-accent-soft text-accent-ink',
  green: 'bg-green-soft text-green',
  red: 'bg-red-soft text-red',
  ink: 'bg-ink text-card',
  outline: 'border border-line bg-transparent text-muted',
}

export function Pill({
  children,
  tone = 'neutral',
  className,
  dot,
}: {
  children: ReactNode
  tone?: PillTone
  className?: string
  /** leading status dot */
  dot?: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold leading-none',
        PILL_TONES[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  )
}

/** status grammar shorthand (ux-research §5.2): word → tone */
export function statusTone(s: string): PillTone {
  if (/running|live|active|approved|done|confirmed/i.test(s)) return 'green'
  if (/waiting|pending|with |getting|onboarding|joining/i.test(s)) return 'amber'
  if (/paused|declined|suspended|overdue/i.test(s)) return 'red'
  if (/draft/i.test(s)) return 'neutral'
  return 'neutral'
}

/* ─────────────────────────────────────────────────────────── Button */

export function Btn({
  children,
  variant = 'dark',
  size = 'md',
  className,
  onClick,
  disabled,
  type = 'button',
}: {
  children: ReactNode
  variant?: 'dark' | 'amber' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit'
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all',
        'disabled:cursor-not-allowed disabled:opacity-40',
        size === 'sm' && 'h-8 px-3.5 text-[12.5px]',
        size === 'md' && 'h-10 px-5 text-[13.5px]',
        size === 'lg' && 'h-12 px-7 text-[14.5px]',
        variant === 'dark' && 'bg-ink text-card hover:bg-ink-soft active:scale-[0.98]',
        variant === 'amber' && 'bg-accent text-ink hover:brightness-105 active:scale-[0.98]',
        variant === 'outline' && 'border border-line bg-card text-ink hover:bg-card2',
        variant === 'ghost' && 'text-muted hover:bg-card2 hover:text-ink',
        variant === 'danger' && 'bg-red-soft text-red hover:brightness-95',
        className,
      )}
    >
      {children}
    </button>
  )
}

/* ─────────────────────────────────────────────────────────── Avatar */

const AVATAR_HUES = [
  'bg-[#F3DFAE] text-[#7A5707]',
  'bg-[#E5D3C2] text-[#6B4B2A]',
  'bg-[#D6E0C5] text-[#4C6132]',
  'bg-[#D8DEE6] text-[#3F4F63]',
  'bg-[#EAD4CD] text-[#7C4434]',
  'bg-[#DED4E4] text-[#5A4768]',
]

export function Avatar({
  name,
  hue = 0,
  size = 'md',
  className,
}: {
  name: string
  hue?: number
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full font-bold tracking-tight',
        size === 'xs' && 'h-6 w-6 text-[9px]',
        size === 'sm' && 'h-8 w-8 text-[11px]',
        size === 'md' && 'h-10 w-10 text-[13px]',
        size === 'lg' && 'h-12 w-12 text-[15px]',
        size === 'xl' && 'h-16 w-16 text-[20px]',
        AVATAR_HUES[hue % AVATAR_HUES.length],
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}

/* ─────────────────────────────────────────────────────────── Section heading */

export function SectionTitle({
  children,
  hint,
  right,
  className,
}: {
  children: ReactNode
  hint?: string
  right?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-4 flex items-end justify-between gap-4', className)}>
      <div>
        <h3 className="text-[15px] font-bold tracking-tight">{children}</h3>
        {hint && <p className="mt-0.5 text-[12.5px] text-muted">{hint}</p>}
      </div>
      {right}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────── Page header */

export function PageHeader({
  eyebrow,
  title,
  sub,
  actions,
}: {
  eyebrow?: string
  title: ReactNode
  sub?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <div className="mb-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">{eyebrow}</div>}
        <h1 className="font-display text-[32px] font-medium leading-tight tracking-tight">{title}</h1>
        {sub && <p className="mt-1 max-w-xl text-[13.5px] text-muted">{sub}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────── Stat */

export function Stat({
  value,
  label,
  icon,
  className,
}: {
  value: ReactNode
  label: string
  icon?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      {icon && (
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-card2 text-muted [&>svg]:h-4 [&>svg]:w-4">
          {icon}
        </span>
      )}
      <div>
        <div className="text-[24px] font-bold leading-none tracking-tight">{value}</div>
        <div className="mt-1 text-[12px] font-medium text-muted">{label}</div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────── Form bits */

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12.5px] font-semibold text-ink-soft">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11.5px] text-muted">{hint}</span>}
    </label>
  )
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'h-10 w-full rounded-xl border border-line bg-card px-3.5 text-[13.5px] placeholder:text-muted/70',
        'focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30',
        props.className,
      )}
    />
  )
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        'h-10 w-full appearance-none rounded-xl border border-line bg-card px-3.5 text-[13.5px]',
        'focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30',
        props.className,
      )}
    />
  )
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="inline-flex items-center gap-2.5"
      aria-pressed={on}
    >
      <span
        className={cn(
          'relative h-6 w-11 rounded-full transition-colors',
          on ? 'bg-ink' : 'bg-line',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-card shadow-sm transition-all',
            on ? 'left-[22px]' : 'left-0.5',
          )}
        />
      </span>
      {label && <span className="text-[13px] font-medium">{label}</span>}
    </button>
  )
}

/* ─────────────────────────────────────────────────────────── Segmented pills */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: readonly T[]
  value: T
  onChange: (v: T) => void
  className?: string
}) {
  return (
    <div className={cn('inline-flex items-center gap-1 rounded-full bg-card2 p-1', className)}>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={cn(
            'rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-all',
            value === o ? 'bg-ink text-card shadow-sm' : 'text-muted hover:text-ink',
          )}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────── Editable sentence chip (Journey 3) */

export function SentenceChip({
  children,
  onClick,
  active,
}: {
  children: ReactNode
  onClick?: () => void
  active?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'mx-0.5 inline-flex items-center rounded-lg border-b-2 px-1.5 py-0.5 font-bold transition-colors',
        active
          ? 'border-accent bg-accent-soft text-accent-ink'
          : 'border-accent/70 bg-transparent text-ink hover:bg-accent-soft/60',
      )}
    >
      {children}
    </button>
  )
}

/* ─────────────────────────────────────────────────────────── Progress bar */

export function Progress({ value, className, tone = 'amber' }: { value: number; className?: string; tone?: 'amber' | 'green' | 'ink' }) {
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-line/60', className)}>
      <div
        className={cn(
          'h-full rounded-full transition-all',
          tone === 'amber' && 'bg-accent',
          tone === 'green' && 'bg-green',
          tone === 'ink' && 'bg-ink',
        )}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

/* ─────────────────────────────────────────────────────────── Timeline (status tracking, §5.2) */

export function Timeline({ steps }: { steps: { label: string; at?: string; done: boolean }[] }) {
  return (
    <ol className="space-y-0">
      {steps.map((s, i) => (
        <li key={i} className="relative flex gap-3 pb-4 last:pb-0">
          {i < steps.length - 1 && (
            <span className={cn('absolute left-[7px] top-5 h-full w-0.5', s.done ? 'bg-green/40' : 'bg-line')} />
          )}
          <span
            className={cn(
              'relative mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2',
              s.done ? 'border-green bg-green' : 'border-line bg-card',
            )}
          >
            {s.done && (
              <svg viewBox="0 0 10 10" className="h-2 w-2 text-card" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 5.5 4 7.5 8 3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
          <div>
            <div className={cn('text-[13px] font-semibold leading-tight', !s.done && 'text-muted')}>{s.label}</div>
            {s.at && <div className="text-[11.5px] text-muted">{s.at}</div>}
          </div>
        </li>
      ))}
    </ol>
  )
}

/* ─────────────────────────────────────────────────────────── Drawer + Modal */

function Overlay({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 animate-fade-in bg-ink/30 backdrop-blur-[2px]" onClick={onClose} />
      {children}
    </div>
  )
}

export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}) {
  if (!open) return null
  return (
    <Overlay onClose={onClose}>
      <div
        className={cn(
          'absolute bottom-3 right-3 top-3 flex animate-slide-in flex-col overflow-hidden rounded-3xl bg-card shadow-pop',
          wide ? 'w-[560px] max-w-[calc(100vw-24px)]' : 'w-[440px] max-w-[calc(100vw-24px)]',
        )}
      >
        <div className="flex items-center justify-between border-b border-line/70 px-6 py-4">
          <h3 className="text-[16px] font-bold tracking-tight">{title}</h3>
          <button onClick={onClose} className="rounded-full p-1.5 text-muted hover:bg-card2 hover:text-ink" aria-label="Close">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="border-t border-line/70 bg-card2/50 px-6 py-4">{footer}</div>}
      </div>
    </Overlay>
  )
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}) {
  if (!open) return null
  return (
    <Overlay onClose={onClose}>
      <div className="absolute inset-0 flex items-center justify-center p-6" onClick={onClose}>
        <div
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'flex max-h-[85vh] w-full animate-scale-in flex-col overflow-hidden rounded-3xl bg-card shadow-pop',
            wide ? 'max-w-2xl' : 'max-w-lg',
          )}
        >
          {title && (
            <div className="flex items-center justify-between px-6 pb-2 pt-5">
              <h3 className="text-[17px] font-bold tracking-tight">{title}</h3>
              <button onClick={onClose} className="rounded-full p-1.5 text-muted hover:bg-card2 hover:text-ink" aria-label="Close">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
          )}
          <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
          {footer && <div className="border-t border-line/70 bg-card2/50 px-6 py-4">{footer}</div>}
        </div>
      </div>
    </Overlay>
  )
}

/* ─────────────────────────────────────────────────────────── Empty state (§5.3) */

export function EmptyState({
  title,
  body,
  action,
  icon,
}: {
  title: string
  body: string
  action?: ReactNode
  icon?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-card2/40 px-8 py-12 text-center">
      {icon && <div className="mb-3 text-muted [&>svg]:h-7 [&>svg]:w-7">{icon}</div>}
      <h4 className="text-[15px] font-bold">{title}</h4>
      <p className="mx-auto mt-1 max-w-sm text-[13px] text-muted">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
