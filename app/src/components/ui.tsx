/* eslint-disable react-refresh/only-export-components */
/**
 * SatelliteHR UI primitives — calm enterprise SaaS.
 * Hand-built, dependency-light, themed via CSS tokens (light/dark).
 * Import everything from "@/components/ui" (alias) or relative path.
 */
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { createPortal } from 'react-dom'
import { X, Check } from 'lucide-react'
import { cn } from '../lib/cn'

/* ----------------------------------------------------------------- Button */
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'subtle'
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

const btnBase =
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-surface disabled:opacity-50 disabled:pointer-events-none cursor-pointer whitespace-nowrap'

const btnVariants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-fg hover:bg-primary/90 shadow-sm',
  secondary: 'bg-surface2 text-fg hover:bg-muted border border-border',
  ghost: 'text-muted-fg hover:bg-muted hover:text-fg',
  outline: 'border border-border bg-surface text-fg hover:bg-muted',
  danger: 'bg-danger text-white hover:bg-danger/90 shadow-sm',
  subtle: 'bg-primary/10 text-primary hover:bg-primary/15',
}

const btnSizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-9 px-4 text-sm',
  lg: 'h-11 px-5 text-[15px]',
  icon: 'h-9 w-9 p-0',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button className={cn(btnBase, btnVariants[variant], btnSizes[size], className)} {...props} />
}

/* ----------------------------------------------------------------- Card */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-2xl border border-border bg-surface shadow-card', className)}
      {...props}
    />
  )
}
export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center justify-between gap-3 px-5 py-4 border-b border-border', className)} {...props} />
}
export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-sm font-bold tracking-tight', className)} {...props} />
}
export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5', className)} {...props} />
}

/* ----------------------------------------------------------------- Badge */
type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'accent2'
const toneClasses: Record<Tone, string> = {
  neutral: 'bg-muted text-muted-fg',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/12 text-success',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-danger/12 text-danger',
  info: 'bg-info/12 text-info',
  accent: 'bg-accent/12 text-accent',
  accent2: 'bg-accent2/15 text-accent2',
}
export function Badge({
  tone = 'neutral',
  className,
  dot = false,
  children,
}: {
  tone?: Tone
  className?: string
  dot?: boolean
  children: ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        toneClasses[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}

/* ----------------------------------------------------------------- Avatar */
const avatarColors = [
  'bg-indigo-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500',
  'bg-sky-500', 'bg-violet-500', 'bg-teal-500', 'bg-fuchsia-500',
]
export function Avatar({
  name,
  size = 'md',
  className,
}: {
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
  const colorIdx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % avatarColors.length
  const sizes = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-9 w-9 text-sm',
    lg: 'h-12 w-12 text-base',
  }
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white',
        avatarColors[colorIdx],
        sizes[size],
        className,
      )}
    >
      {initials}
    </span>
  )
}

/* ----------------------------------------------------------------- IconButton (circular) */
/** Circular icon button — the reference's card-header (+, share, calendar) and rail buttons. */
type IconBtnVariant = 'outline' | 'ghost' | 'solid' | 'soft'
export function IconButton({
  variant = 'outline',
  size = 'md',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: IconBtnVariant; size?: 'sm' | 'md' | 'lg' }) {
  const variants: Record<IconBtnVariant, string> = {
    outline: 'border border-border bg-surface text-muted-fg hover:text-fg hover:border-muted-fg/40',
    ghost: 'text-muted-fg hover:bg-muted hover:text-fg',
    solid: 'bg-primary text-primary-fg hover:bg-primary/90',
    soft: 'bg-muted text-fg hover:bg-border/70',
  }
  const sizes = { sm: 'h-8 w-8', md: 'h-9 w-9', lg: 'h-10 w-10' }
  return (
    <button
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full transition-colors cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-surface',
        'disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  )
}

/* ----------------------------------------------------------------- Avatar stack */
/** Overlapping avatars + optional "+N" — the reference's journey participant cluster. */
export function AvatarStack({
  names,
  max = 5,
  size = 'sm',
  className,
}: {
  names: string[]
  max?: number
  size?: 'xs' | 'sm' | 'md'
  className?: string
}) {
  const shown = names.slice(0, max)
  const extra = names.length - shown.length
  const ring = 'ring-2 ring-surface'
  const overlap = { xs: '-ml-2', sm: '-ml-2.5', md: '-ml-3' }[size]
  const bubble = { xs: 'h-6 w-6 text-[10px]', sm: 'h-8 w-8 text-xs', md: 'h-9 w-9 text-sm' }[size]
  return (
    <div className={cn('flex items-center', className)}>
      {shown.map((n, i) => (
        <Avatar key={n + i} name={n} size={size} className={cn(ring, i > 0 && overlap)} />
      ))}
      {extra > 0 && (
        <span
          className={cn(
            'inline-flex shrink-0 items-center justify-center rounded-full bg-muted font-bold text-muted-fg',
            ring, overlap, bubble,
          )}
        >
          +{extra}
        </span>
      )}
    </div>
  )
}

/* ----------------------------------------------------------------- Inputs */
export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  label?: string
  hint?: string
  error?: string
  required?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <label className={cn('block', className)}>
      {label && (
        <span className="mb-1.5 flex items-center gap-1 text-[13px] font-semibold text-fg">
          {label}
          {required && <span className="text-danger">*</span>}
        </span>
      )}
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-muted-fg">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-danger">{error}</span>}
    </label>
  )
}

const inputBase =
  'w-full rounded-lg border border-border bg-surface px-3 text-sm text-fg placeholder:text-muted-fg/70 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputBase, 'h-9', className)} {...props} />
}
export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputBase, 'py-2 min-h-[80px]', className)} {...props} />
}
export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(inputBase, 'h-9 cursor-pointer pr-8', className)} {...props}>
      {children}
    </select>
  )
}

/* ----------------------------------------------------------------- Switch / Checkbox */
export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2.5 cursor-pointer"
    >
      <span
        className={cn(
          'relative h-5 w-9 rounded-full transition-colors',
          checked ? 'bg-primary' : 'bg-border',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
            checked && 'translate-x-4',
          )}
        />
      </span>
      {label && <span className="text-sm text-fg">{label}</span>}
    </button>
  )
}

/* ----------------------------------------------------------------- Segmented control */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: ReactNode }[]
  value: T
  onChange: (v: T) => void
  className?: string
}) {
  return (
    <div className={cn('inline-flex items-center gap-1 rounded-lg bg-muted p-1', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-md px-3 py-1 text-[13px] font-semibold transition-colors cursor-pointer',
            value === o.value ? 'bg-surface text-fg shadow-sm' : 'text-muted-fg hover:text-fg',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/* ----------------------------------------------------------------- Tabs */
export function Tabs({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: { value: string; label: ReactNode }[]
  value: string
  onChange: (v: string) => void
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-1 border-b border-border', className)}>
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={cn(
            'relative -mb-px px-3.5 py-2.5 text-sm font-semibold transition-colors cursor-pointer',
            value === t.value ? 'text-primary' : 'text-muted-fg hover:text-fg',
          )}
        >
          {t.label}
          {value === t.value && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />}
        </button>
      ))}
    </div>
  )
}

/* ----------------------------------------------------------------- Table */
export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn('w-full text-sm', className)} {...props} />
    </div>
  )
}
export function Th({ className, ...props }: HTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'whitespace-nowrap px-4 py-2.5 text-left text-2xs font-bold uppercase tracking-wide text-muted-fg',
        className,
      )}
      {...props}
    />
  )
}
export function Td({ className, ...props }: HTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-4 py-3 align-middle', className)} {...props} />
}
export function Tr({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn('border-t border-border transition-colors hover:bg-muted/50', className)} {...props} />
}

/* ----------------------------------------------------------------- Tooltip (lightweight) */
export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  const [show, setShow] = useState(false)
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      {show && (
        <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-fg px-2 py-1 text-2xs font-medium text-bg shadow-pop animate-fade-in">
          {label}
        </span>
      )}
    </span>
  )
}

/* ----------------------------------------------------------------- Modal / Dialog */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title?: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null
  const widths = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6">
      <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative z-10 mt-[6vh] w-full rounded-2xl border border-border bg-surface shadow-pop animate-scale-in',
          widths[size],
        )}
      >
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-border">
            <div>
              {title && <h2 className="text-base font-bold tracking-tight">{title}</h2>}
              {description && <p className="mt-0.5 text-sm text-muted-fg">{description}</p>}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

/* ----------------------------------------------------------------- Drawer (right sheet) */
export function Drawer({
  open,
  onClose,
  title,
  children,
  width = 'max-w-md',
}: {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  width?: string
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'absolute right-0 top-0 h-full w-full overflow-y-auto border-l border-border bg-surface shadow-pop animate-slide-up',
          width,
        )}
      >
        {title && (
          <div className="sticky top-0 flex items-center justify-between gap-3 border-b border-border bg-surface px-5 py-4">
            <h2 className="text-base font-bold tracking-tight">{title}</h2>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body,
  )
}

/* ----------------------------------------------------------------- Page header */
export function PageHeader({
  title,
  subtitle,
  actions,
  icon,
}: {
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  icon?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        {icon && (
          <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </span>
        )}
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-fg">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-muted-fg">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}

/* ----------------------------------------------------------------- Stat card */
export function StatCard({
  label,
  value,
  delta,
  deltaTone = 'success',
  icon,
}: {
  label: string
  value: ReactNode
  delta?: string
  deltaTone?: Tone
  icon?: ReactNode
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold text-muted-fg">{label}</span>
        {icon && <span className="text-muted-fg">{icon}</span>}
      </div>
      <div className="mt-2 flex items-end gap-2">
        <span className="text-2xl font-extrabold tracking-tight tnum">{value}</span>
        {delta && <Badge tone={deltaTone} className="mb-1">{delta}</Badge>}
      </div>
    </Card>
  )
}

/* ----------------------------------------------------------------- Empty state */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface2/50 px-6 py-12 text-center">
      {icon && (
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-fg">
          {icon}
        </span>
      )}
      <h3 className="text-sm font-bold text-fg">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-fg">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/* ----------------------------------------------------------------- Stepper */
export function Stepper({
  steps,
  current,
  onStepClick,
}: {
  steps: string[]
  current: number
  onStepClick?: (i: number) => void
}) {
  return (
    <ol className="flex flex-wrap items-center gap-y-2">
      {steps.map((s, i) => {
        const state = i < current ? 'done' : i === current ? 'active' : 'todo'
        return (
          <li key={s} className="flex items-center">
            <button
              type="button"
              onClick={() => onStepClick?.(i)}
              disabled={!onStepClick}
              className={cn('flex items-center gap-2', onStepClick && 'cursor-pointer')}
            >
              <span
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors',
                  state === 'done' && 'bg-primary text-primary-fg',
                  state === 'active' && 'bg-primary/15 text-primary ring-2 ring-primary',
                  state === 'todo' && 'bg-muted text-muted-fg',
                )}
              >
                {state === 'done' ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span
                className={cn(
                  'hidden text-[13px] font-semibold sm:inline',
                  state === 'todo' ? 'text-muted-fg' : 'text-fg',
                )}
              >
                {s}
              </span>
            </button>
            {i < steps.length - 1 && <span className="mx-2 h-px w-6 bg-border sm:w-10" />}
          </li>
        )
      })}
    </ol>
  )
}

/* ----------------------------------------------------------------- Progress bar */
export function ProgressBar({ value, tone = 'primary', className }: { value: number; tone?: Tone; className?: string }) {
  const bar: Record<Tone, string> = {
    neutral: 'bg-muted-fg', primary: 'bg-primary', success: 'bg-success',
    warning: 'bg-warning', danger: 'bg-danger', info: 'bg-info', accent: 'bg-accent', accent2: 'bg-accent2',
  }
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-muted', className)}>
      <div className={cn('h-full rounded-full transition-all', bar[tone])} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  )
}

/* ----------------------------------------------------------------- Toast (minimal) */
type Toast = { id: number; title: string; tone?: Tone }
const ToastCtx = createContext<{ push: (t: Omit<Toast, 'id'>) => void }>({ push: () => {} })
export function useToast() {
  return useContext(ToastCtx)
}
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const idRef = useRef(0)
  const push = (t: Omit<Toast, 'id'>) => {
    const id = ++idRef.current
    setToasts((p) => [...p, { ...t, id }])
    setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200)
  }
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      {createPortal(
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2" aria-live="polite">
          {toasts.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 text-sm font-semibold shadow-pop animate-slide-up"
            >
              <span className={cn('h-2 w-2 rounded-full', toneClasses[t.tone ?? 'success'])} />
              {t.title}
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastCtx.Provider>
  )
}

/* helper so generated code can label inputs uniquely if needed */
export function useFieldId(prefix = 'f') {
  const id = useId()
  return `${prefix}-${id}`
}
