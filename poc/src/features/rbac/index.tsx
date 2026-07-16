import { Fragment, useState, type ReactNode } from 'react'
import {
  ChevronRight,
  KeyRound,
  Layers,
  Lock,
  ShieldCheck,
  UserCog,
  Boxes,
} from 'lucide-react'
import { cn } from '@/utils/helpers'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { LEVEL_CLASS, LevelLegend } from './components/level-badge'
import {
  ALL_MODULES,
  DOMAINS,
  LEVEL_META,
  ROLES,
  TIERS,
  levelFor,
  roleSummary,
  subAccess,
  type Domain,
  type Level,
  type Module,
  type RoleDef,
  type RoleId,
  type Tier,
} from './data/rbac-model'

// Tier accent — used on role avatars, dots, and column bands.
const TIER_COLOR: Record<Tier, { dot: string; avatar: string; band: string; text: string }> = {
  Platform: { dot: 'bg-indigo-500', avatar: 'bg-indigo-500', band: 'bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-300' },
  Portfolio: { dot: 'bg-sky-500', avatar: 'bg-sky-500', band: 'bg-sky-500/10', text: 'text-sky-600 dark:text-sky-300' },
  Group: { dot: 'bg-teal-500', avatar: 'bg-teal-500', band: 'bg-teal-500/10', text: 'text-teal-600 dark:text-teal-300' },
  Company: { dot: 'bg-violet-500', avatar: 'bg-violet-500', band: 'bg-violet-500/10', text: 'text-violet-600 dark:text-violet-300' },
  Manager: { dot: 'bg-amber-500', avatar: 'bg-amber-500', band: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-300' },
  Workforce: { dot: 'bg-slate-500', avatar: 'bg-slate-500', band: 'bg-slate-500/10', text: 'text-slate-600 dark:text-slate-300' },
}

const ROLES_BY_TIER = TIERS.map((tier) => ({
  tier,
  roles: ROLES.filter((r) => r.tier === tier),
}))

const TOTAL_SUBS = DOMAINS.reduce(
  (n, d) => n + d.modules.reduce((m, mod) => m + mod.subs.length, 0),
  0
)
const COMP_DARK_MODULES = ALL_MODULES.filter((x) => x.module.compDark).length

export function RbacPage() {
  const [tab, setTab] = useState('matrix')
  const [focusRole, setFocusRole] = useState<RoleId>('c-hr')
  const [hideNone, setHideNone] = useState(true)

  return (
    <>
      <CommonHeader title='Access Control' />
      <Main className='space-y-6'>
        {/* Intro / hero */}
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div className='flex items-start gap-3'>
            <span className='flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm'>
              <KeyRound className='size-5' />
            </span>
            <div>
              <h2 className='text-lg font-semibold'>Role-Based Access Control</h2>
              <p className='text-muted-foreground max-w-2xl text-sm'>
                What every role can see, edit, approve and do across all{' '}
                {DOMAINS.length} domains — derived from the SatelliteHR BRD (§6
                roles, §7 module universe, comp-dark & tenant-isolation rules).
              </p>
            </div>
          </div>
          <Badge
            variant='outline'
            className='gap-1.5 whitespace-nowrap'
          >
            <ShieldCheck className='size-3.5 text-emerald-500' />
            BRD baseline policy
          </Badge>
        </div>

        {/* Stat cards */}
        <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
          <StatCard label='Roles' value={ROLES.length} hint='Across 6 tiers' icon={<UserCog className='size-4' />} tone='text-indigo-600' />
          <StatCard label='Governed modules' value={ALL_MODULES.length} hint={`${DOMAINS.length} domains`} icon={<Layers className='size-4' />} tone='text-sky-600' />
          <StatCard label='Submodules' value={TOTAL_SUBS} hint='Capability-level' icon={<Boxes className='size-4' />} tone='text-violet-600' />
          <StatCard label='Comp-dark modules' value={COMP_DARK_MODULES} hint='HR/Finance only' icon={<Lock className='size-4' />} tone='text-amber-600' />
        </div>

        {/* Role roster */}
        <SectionCard
          title='Roles'
          description='Select a role to focus its effective access. The 18 canonical actors span platform, portfolio, group, company, manager and workforce tiers.'
        >
          <div className='space-y-4'>
            {ROLES_BY_TIER.map(({ tier, roles }) => (
              <div key={tier}>
                <p className={cn('mb-2 text-[11px] font-semibold uppercase tracking-wider', TIER_COLOR[tier].text)}>
                  {tier}
                </p>
                <div className='grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3'>
                  {roles.map((role) => (
                    <RoleCard
                      key={role.id}
                      role={role}
                      focused={role.id === focusRole}
                      onSelect={() => {
                        setFocusRole(role.id)
                        setTab('effective')
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <Tabs value={tab} onValueChange={setTab} className='space-y-4'>
          <TabsList>
            <TabsTrigger value='matrix'>Access Matrix</TabsTrigger>
            <TabsTrigger value='effective'>Effective Access</TabsTrigger>
            <TabsTrigger value='roles'>Role Reference</TabsTrigger>
          </TabsList>

          <TabsContent value='matrix' className='focus-visible:outline-none'>
            <SectionCard
              title='Access matrix'
              description='Every module × every role. Click a module row to expand its submodules. Comp-dark surfaces are marked with a lock.'
              actions={<LevelLegend />}
              bodyClassName='p-0'
            >
              <AccessMatrix />
            </SectionCard>
          </TabsContent>

          <TabsContent value='effective' className='focus-visible:outline-none'>
            <EffectiveAccess
              role={focusRole}
              hideNone={hideNone}
              setHideNone={setHideNone}
            />
          </TabsContent>

          <TabsContent value='roles' className='focus-visible:outline-none'>
            <RoleReference />
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}

// ─── Role roster card ────────────────────────────────────────────────────────

function RoleCard({ role, focused, onSelect }: { role: RoleDef; focused: boolean; onSelect: () => void }) {
  const s = roleSummary(role.id)
  return (
    <button
      type='button'
      onClick={onSelect}
      aria-pressed={focused}
      className={cn(
        'group flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all hover:shadow-sm',
        focused ? 'border-primary/40 bg-primary/[0.04] ring-1 ring-primary/20' : 'bg-card border-border'
      )}
    >
      <Avatar className='size-9'>
        <AvatarFallback className={cn('text-[11px] font-semibold text-white', TIER_COLOR[role.tier].avatar)}>
          {role.short.slice(0, 3)}
        </AvatarFallback>
      </Avatar>
      <div className='min-w-0 flex-1'>
        <p className='truncate text-sm font-semibold'>{role.name}</p>
        <p className='text-muted-foreground truncate text-xs'>
          {s.manage} manage · {s.edit + s.approve} act · {s.view + s.self} view
        </p>
      </div>
      <ChevronRight className='text-muted-foreground/50 size-4 shrink-0 transition-transform group-hover:translate-x-0.5' />
    </button>
  )
}

// ─── Access matrix (modules × roles, expandable to submodules) ───────────────

function AccessMatrix() {
  const [open, setOpen] = useState<Set<string>>(new Set())
  const toggle = (code: string) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })

  return (
    <div className='overflow-x-auto'>
      <table className='w-full border-collapse text-sm'>
        <thead>
          <tr className='border-b'>
            <th rowSpan={2} className='bg-card sticky left-0 z-20 min-w-[260px] px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground'>
              Module / Submodule
            </th>
            {ROLES_BY_TIER.map(({ tier, roles }) => (
              <th key={tier} colSpan={roles.length} className={cn('px-1 py-1 text-center text-[10px] font-semibold uppercase tracking-wider', TIER_COLOR[tier].text, TIER_COLOR[tier].band)}>
                {tier}
              </th>
            ))}
          </tr>
          <tr className='border-b'>
            {ROLES.map((role) => (
              <th key={role.id} className='min-w-[42px] px-1 py-2 text-center align-bottom'>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className='inline-flex cursor-default items-center gap-1'>
                      <span className={cn('size-1.5 rounded-full', TIER_COLOR[role.tier].dot)} />
                      <span className='text-[10px] font-semibold'>{role.short}</span>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className='max-w-56'>
                    <p className='font-semibold'>{role.name}</p>
                    <p className='text-xs opacity-80'>{role.capability}</p>
                  </TooltipContent>
                </Tooltip>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DOMAINS.map((domain) => (
            <DomainRows key={domain.code} domain={domain} open={open} toggle={toggle} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DomainRows({ domain, open, toggle }: { domain: Domain; open: Set<string>; toggle: (c: string) => void }) {
  return (
    <>
      <tr className='bg-muted/50'>
        <td colSpan={ROLES.length + 1} className='bg-muted/50 sticky left-0 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-foreground'>
          {domain.code} · {domain.name}
        </td>
      </tr>
      {domain.modules.map((mod) => {
        const isOpen = open.has(mod.code)
        return (
          <Fragment key={mod.code}>
            <tr
              className='hover:bg-muted/30 cursor-pointer border-b'
              onClick={() => toggle(mod.code)}
            >
              <td className='bg-card sticky left-0 z-10 px-4 py-2'>
                <div className='flex items-center gap-1.5'>
                  <ChevronRight className={cn('text-muted-foreground size-3.5 shrink-0 transition-transform', isOpen && 'rotate-90')} />
                  <span className='text-muted-foreground shrink-0 text-[11px] font-semibold'>{mod.code}</span>
                  <span className='truncate text-[13px] font-medium'>{mod.name}</span>
                  {mod.compDark && <Lock className='size-3 shrink-0 text-amber-500' />}
                </div>
              </td>
              {ROLES.map((role) => (
                <Cell key={role.id} level={levelFor(mod.access, role.id)} />
              ))}
            </tr>
            {isOpen &&
              mod.subs.map((sub) => (
                <tr key={mod.code + sub.name} className='border-b bg-muted/[0.15]'>
                  <td className='bg-muted/[0.15] sticky left-0 z-10 py-1.5 pl-11 pr-4'>
                    <div className='flex items-center gap-1.5'>
                      <span className='truncate text-xs text-muted-foreground'>{sub.name}</span>
                      {sub.compDark && <Lock className='size-2.5 shrink-0 text-amber-500' />}
                    </div>
                  </td>
                  {ROLES.map((role) => (
                    <Cell key={role.id} level={levelFor(subAccess(mod, sub), role.id)} sub />
                  ))}
                </tr>
              ))}
          </Fragment>
        )
      })}
    </>
  )
}

function Cell({ level, sub }: { level: Level; sub?: boolean }) {
  const meta = LEVEL_META[level]
  return (
    <td className='px-1 py-1 text-center'>
      <span
        title={`${meta.label} — ${meta.desc}`}
        className={cn(
          'inline-flex items-center justify-center rounded text-[10px] font-bold',
          sub ? 'size-5' : 'size-6',
          LEVEL_CLASS[level].cell
        )}
      >
        {meta.abbr}
      </span>
    </td>
  )
}

// ─── Effective access (focused role) ─────────────────────────────────────────

function EffectiveAccess({ role, hideNone, setHideNone }: { role: RoleId; hideNone: boolean; setHideNone: (v: boolean) => void }) {
  const def = ROLES.find((r) => r.id === role)!
  const s = roleSummary(role)
  const order: Level[] = ['manage', 'edit', 'approve', 'view', 'self', 'none']

  return (
    <div className='space-y-4'>
      {/* Focus header */}
      <Card className='p-4'>
        <div className='flex flex-wrap items-center justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <Avatar className='size-11'>
              <AvatarFallback className={cn('text-sm font-semibold text-white', TIER_COLOR[def.tier].avatar)}>
                {def.short.slice(0, 3)}
              </AvatarFallback>
            </Avatar>
            <div className='min-w-0'>
              <div className='flex items-center gap-2'>
                <p className='text-sm font-semibold'>{def.name}</p>
                <Badge variant='outline' className={cn('text-[10px]', TIER_COLOR[def.tier].text)}>{def.tier}</Badge>
              </div>
              <p className='text-muted-foreground max-w-xl text-xs'>{def.capability}</p>
            </div>
          </div>
          <div className='flex flex-wrap gap-2'>
            {order.map((lvl) => (
              <div key={lvl} className='rounded-md border px-2.5 py-1 text-center'>
                <p className={cn('text-base font-semibold tabular-nums', lvl === 'none' ? 'text-muted-foreground' : '')}>{s[lvl]}</p>
                <p className='text-muted-foreground text-[10px] uppercase tracking-wide'>{LEVEL_META[lvl].label}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className='flex items-center justify-between'>
        <p className='text-muted-foreground text-xs'>
          Module & submodule access for <span className='font-medium text-foreground'>{def.name}</span>. Comp-dark surfaces are locked to HR/Finance.
        </p>
        <label className='flex cursor-pointer items-center gap-2 text-xs'>
          <Switch checked={hideNone} onCheckedChange={setHideNone} />
          Hide no-access
        </label>
      </div>

      <div className='space-y-4'>
        {DOMAINS.map((domain) => {
          const mods = domain.modules.filter((m) => !hideNone || levelFor(m.access, role) !== 'none')
          if (mods.length === 0) return null
          return (
            <SectionCard key={domain.code} title={`${domain.code} · ${domain.name}`} description={domain.blurb}>
              <div className='space-y-3'>
                {mods.map((mod) => (
                  <EffectiveModule key={mod.code} mod={mod} role={role} hideNone={hideNone} />
                ))}
              </div>
            </SectionCard>
          )
        })}
      </div>
    </div>
  )
}

function EffectiveModule({ mod, role, hideNone }: { mod: Module; role: RoleId; hideNone: boolean }) {
  const modLevel = levelFor(mod.access, role)
  const subs = mod.subs.filter((sub) => !hideNone || levelFor(subAccess(mod, sub), role) !== 'none')
  return (
    <div className={cn('rounded-lg border p-3', modLevel === 'none' && 'opacity-60')}>
      <div className='flex flex-wrap items-center gap-2'>
        <span className='text-muted-foreground text-[11px] font-semibold'>{mod.code}</span>
        <span className='text-[13px] font-medium'>{mod.name}</span>
        {mod.compDark && (
          <span className='inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400'>
            <Lock className='size-3' /> comp-dark
          </span>
        )}
        <span className='ms-auto'>
          <LevelChip level={modLevel} />
        </span>
      </div>
      <p className='text-muted-foreground mt-0.5 text-xs'>{mod.purpose}</p>
      {subs.length > 0 && (
        <div className='mt-2.5 flex flex-wrap gap-1.5'>
          {subs.map((sub) => {
            const lvl = levelFor(subAccess(mod, sub), role)
            return (
              <span
                key={sub.name}
                className={cn(
                  'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset',
                  LEVEL_CLASS[lvl].chip
                )}
                title={`${sub.name} — ${LEVEL_META[lvl].label}`}
              >
                {lvl !== 'none' && <span className={cn('size-1.5 rounded-full', LEVEL_CLASS[lvl].dot)} />}
                {sub.name}
                {sub.compDark && <Lock className='size-2.5 opacity-70' />}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}

function LevelChip({ level }: { level: Level }) {
  const meta = LEVEL_META[level]
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset', LEVEL_CLASS[level].chip)}>
      {level !== 'none' && <span className={cn('size-1.5 rounded-full', LEVEL_CLASS[level].dot)} />}
      {meta.label}
    </span>
  )
}

// ─── Role reference ──────────────────────────────────────────────────────────

function RoleReference() {
  return (
    <div className='space-y-4'>
      {ROLES_BY_TIER.map(({ tier, roles }) => (
        <SectionCard key={tier} title={`${tier} tier`}>
          <div className='divide-y'>
            {roles.map((role) => (
              <div key={role.id} className='flex items-start gap-3 py-2.5 first:pt-0 last:pb-0'>
                <Avatar className='size-8 shrink-0'>
                  <AvatarFallback className={cn('text-[10px] font-semibold text-white', TIER_COLOR[tier].avatar)}>
                    {role.short.slice(0, 3)}
                  </AvatarFallback>
                </Avatar>
                <div className='min-w-0'>
                  <p className='text-sm font-semibold'>{role.name}</p>
                  <p className='text-muted-foreground text-xs'>{role.capability}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      ))}
    </div>
  )
}

// ─── Building blocks (mirroring the atlas layout) ────────────────────────────

function StatCard({ label, value, hint, icon, tone }: { label: string; value: number; hint: string; icon: ReactNode; tone: string }) {
  return (
    <Card className='p-4'>
      <div className='flex items-center justify-between'>
        <p className='text-muted-foreground text-xs font-medium'>{label}</p>
        <span className={cn('flex size-7 items-center justify-center rounded-md bg-muted', tone)}>{icon}</span>
      </div>
      <p className='mt-2 text-2xl font-semibold tabular-nums'>{value}</p>
      <p className='text-muted-foreground mt-0.5 text-[11px]'>{hint}</p>
    </Card>
  )
}

function SectionCard({ title, description, actions, children, bodyClassName }: { title: string; description?: string; actions?: ReactNode; children: ReactNode; bodyClassName?: string }) {
  return (
    <Card className='overflow-hidden py-0'>
      <div className='flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3'>
        <div>
          <h3 className='text-sm font-semibold'>{title}</h3>
          {description && <p className='text-muted-foreground mt-0.5 max-w-2xl text-xs'>{description}</p>}
        </div>
        {actions && <div className='shrink-0'>{actions}</div>}
      </div>
      <div className={cn('p-4', bodyClassName)}>{children}</div>
    </Card>
  )
}
