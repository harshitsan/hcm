import { useMemo, useState } from 'react'
import {
  ShieldCheck, Check, CircleDot, Minus, Users, Eye, Layers, Search,
} from 'lucide-react'
import { useApp } from '../app/store'
import { roleDefs, permissionMatrix, type RoleDef } from '../data/mock'
import {
  Badge, Button, Card, CardBody, CardHeader, CardTitle, Input, PageHeader,
  Segmented, Table, Td, Th, Tooltip, Tr, useToast,
} from '../components/ui'
import { cn } from '../lib/cn'

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'accent'

const levelTone: Record<RoleDef['level'], Tone> = {
  Platform: 'danger',
  Portfolio: 'primary',
  Group: 'info',
  Company: 'accent',
  Manager: 'warning',
  Employee: 'neutral',
}

const levelOrder: RoleDef['level'][] = ['Platform', 'Portfolio', 'Group', 'Company', 'Manager', 'Employee']

type Grant = 'full' | 'scoped' | 'none'

function GrantCell({ grant }: { grant: Grant }) {
  if (grant === 'full') {
    return (
      <Tooltip label="Full access">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-success/12 text-success">
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </span>
      </Tooltip>
    )
  }
  if (grant === 'scoped') {
    return (
      <Tooltip label="Scoped — limited to authorized records">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-warning/12 text-warning">
          <CircleDot className="h-3.5 w-3.5" />
        </span>
      </Tooltip>
    )
  }
  return (
    <Tooltip label="No access">
      <span className="inline-flex h-6 w-6 items-center justify-center text-muted-fg/50">
        <Minus className="h-3.5 w-3.5" />
      </span>
    </Tooltip>
  )
}

export default function Roles() {
  const { role } = useApp()
  const { push } = useToast()
  const readOnly = role !== 'provider_admin' && role !== 'company_hr_admin'

  const [level, setLevel] = useState<'all' | RoleDef['level']>('all')
  const [query, setQuery] = useState('')

  const totalUsers = useMemo(() => roleDefs.reduce((a, r) => a + r.users, 0), [])

  const visibleRoles = useMemo(() => {
    const q = query.trim().toLowerCase()
    return roleDefs
      .filter((r) => (level === 'all' ? true : r.level === level))
      .filter((r) => (q ? r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) : true))
      .sort((a, b) => levelOrder.indexOf(a.level) - levelOrder.indexOf(b.level))
  }, [level, query])

  const segmentOptions: { value: 'all' | RoleDef['level']; label: string }[] = [
    { value: 'all', label: 'All' },
    ...levelOrder.map((l) => ({ value: l, label: l })),
  ]

  return (
    <div className="animate-fade-in">
      <PageHeader
        icon={<ShieldCheck className="h-5 w-5" />}
        title="Roles & Security"
        subtitle="Roles are personas — who someone is. Permissions are capabilities — what that persona can do. Scope keeps the same role honest across companies."
        actions={
          <Tooltip label="Simulate a role's view">
            <span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => push({ title: 'Access preview is read-only in this prototype', tone: 'neutral' })}
              >
                <Eye className="h-4 w-4" /> What can this person see?
              </Button>
            </span>
          </Tooltip>
        }
      />

      {/* Controls */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-fg">
          <Badge tone="primary">{roleDefs.length} roles</Badge>
          <span className="tnum">{totalUsers.toLocaleString()} users assigned</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-fg" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search roles…"
              className="h-8 w-48 pl-8 text-[13px]"
            />
          </div>
          <Segmented options={segmentOptions} value={level} onChange={setLevel} className="hidden md:inline-flex" />
        </div>
      </div>

      {/* Role cards */}
      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visibleRoles.map((r) => (
          <Card key={r.name} className="p-4 transition-colors hover:border-primary/40">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold tracking-tight">{r.name}</p>
                <Badge tone={levelTone[r.level]} className="mt-1.5" dot>
                  {r.level}
                </Badge>
              </div>
              <div className="flex shrink-0 items-center gap-1 rounded-lg bg-muted px-2 py-1 text-xs font-semibold text-muted-fg">
                <Users className="h-3.5 w-3.5" />
                <span className="tnum">{r.users}</span>
              </div>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-muted-fg">{r.description}</p>
          </Card>
        ))}
        {visibleRoles.length === 0 && (
          <Card className="p-6 sm:col-span-2 lg:col-span-3">
            <p className="text-center text-sm text-muted-fg">No roles match your filters.</p>
          </Card>
        )}
      </div>

      {/* Permission matrix */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Permission matrix</CardTitle>
            <Badge tone="neutral">capabilities × roles</Badge>
          </div>
          <span className="hidden text-2xs font-semibold uppercase tracking-wide text-muted-fg sm:inline">
            What each role can do
          </span>
        </CardHeader>
        <CardBody className="p-0">
          <Table>
            <thead>
              <tr>
                <Th className="sticky left-0 bg-surface">Capability</Th>
                {permissionMatrix.roles.map((rn) => (
                  <Th key={rn} className="text-center">{rn}</Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissionMatrix.capabilities.map((cap, ci) => (
                <Tr key={cap}>
                  <Td className="sticky left-0 bg-surface font-semibold">{cap}</Td>
                  {permissionMatrix.grid[ci].map((grant, ri) => (
                    <Td key={`${ci}-${ri}`} className="text-center">
                      <div className="flex justify-center">
                        <GrantCell grant={grant} />
                      </div>
                    </Td>
                  ))}
                </Tr>
              ))}
            </tbody>
          </Table>
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border px-4 py-3 text-xs text-muted-fg">
            <span className="text-2xs font-semibold uppercase tracking-wide">Legend</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-success/12 text-success">
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
              Full access
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-warning/12 text-warning">
                <CircleDot className="h-3 w-3" />
              </span>
              Scoped to authorized records
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-flex h-5 w-5 items-center justify-center text-muted-fg/50">
                <Minus className="h-3 w-3" />
              </span>
              No access
            </span>
          </div>
        </CardBody>
      </Card>

      {/* Role bundles note */}
      <div className={cn('mt-6 flex items-start gap-3 rounded-xl border border-border bg-surface2/50 px-4 py-3.5')}>
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Layers className="h-4 w-4" />
        </span>
        <div className="text-sm">
          <p className="font-semibold text-fg">Role bundles</p>
          <p className="mt-0.5 text-muted-fg">
            Capabilities ship as reusable bundles (for example <span className="font-medium text-fg">People Lifecycle</span>,{' '}
            <span className="font-medium text-fg">Approvals</span>, <span className="font-medium text-fg">Reporting</span>) so a new
            role is composed, not hand-wired. Scope is applied on top — the same bundle behaves differently at platform, portfolio
            and company levels.
            {readOnly && ' You are viewing this in read-only mode.'}
          </p>
        </div>
      </div>
    </div>
  )
}
