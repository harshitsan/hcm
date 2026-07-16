import { LEVEL_META, type Level } from '../data/rbac-model'

/** Tailwind classes per access level — used by badges, chips, and matrix cells. */
export const LEVEL_CLASS: Record<Level, { chip: string; cell: string; dot: string }> = {
  manage: {
    chip: 'bg-emerald-500/15 text-emerald-700 ring-emerald-500/30 dark:text-emerald-300',
    cell: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  edit: {
    chip: 'bg-blue-500/15 text-blue-700 ring-blue-500/30 dark:text-blue-300',
    cell: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
    dot: 'bg-blue-500',
  },
  approve: {
    chip: 'bg-violet-500/15 text-violet-700 ring-violet-500/30 dark:text-violet-300',
    cell: 'bg-violet-500/20 text-violet-700 dark:text-violet-300',
    dot: 'bg-violet-500',
  },
  view: {
    chip: 'bg-slate-500/15 text-slate-700 ring-slate-500/30 dark:text-slate-300',
    cell: 'bg-slate-500/15 text-slate-600 dark:text-slate-300',
    dot: 'bg-slate-400',
  },
  self: {
    chip: 'bg-amber-500/15 text-amber-700 ring-amber-500/30 dark:text-amber-300',
    cell: 'bg-amber-500/20 text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  none: {
    chip: 'bg-transparent text-muted-foreground/50 ring-border',
    cell: 'text-muted-foreground/25',
    dot: 'bg-transparent',
  },
}

export function LevelBadge({ level }: { level: Level }) {
  const meta = LEVEL_META[level]
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${LEVEL_CLASS[level].chip}`}
      title={meta.desc}
    >
      {level !== 'none' && (
        <span className={`size-1.5 rounded-full ${LEVEL_CLASS[level].dot}`} />
      )}
      {meta.label}
    </span>
  )
}

const LEGEND_ORDER: Level[] = ['manage', 'edit', 'approve', 'view', 'self', 'none']

export function LevelLegend() {
  return (
    <div className='flex flex-wrap items-center gap-x-3 gap-y-1.5'>
      {LEGEND_ORDER.map((lvl) => (
        <span key={lvl} className='inline-flex items-center gap-1.5 text-xs'>
          <span
            className={`inline-flex size-4 items-center justify-center rounded text-[10px] font-bold ${LEVEL_CLASS[lvl].cell}`}
          >
            {LEVEL_META[lvl].abbr}
          </span>
          <span className='text-muted-foreground'>{LEVEL_META[lvl].label}</span>
        </span>
      ))}
    </div>
  )
}
