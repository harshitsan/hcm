import { useState } from 'react'
import { toast } from 'sonner'
import { useRole } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { activeMemberships, PERSONAS } from '../data/group-companies'
import { seedDirectory } from '../data/sharing'
import { type RecordAudit } from '../hooks/use-audit'
import { type GroupCompaniesStore } from '../hooks/use-group-companies'

interface ReportingTabProps {
  store: GroupCompaniesStore
  record: RecordAudit
}

interface Prerequisite {
  label: string
  pass: boolean
}

/**
 * Consolidated reporting & cross-company directory search (GRP-06/11/25),
 * gated by the shared Rules-engine evaluation of the three configured
 * prerequisites (GRP-14) with row-level security + audit on every access
 * (GRP-08).
 */
export function ReportingTab({ store, record }: ReportingTabProps) {
  const { role } = useRole()
  const persona = PERSONAS[role]
  const isPlatform = role === 'Platform Admin'

  const [groupId, setGroupId] = useState(store.groups[0]?.id ?? '')
  const [query, setQuery] = useState('')
  const [searched, setSearched] = useState<{ scope: string; ids: string[]; withheld: number } | null>(null)
  const [reportOpen, setReportOpen] = useState(false)

  const group = store.groups.find((g) => g.id === groupId) ?? store.groups[0]
  if (!group) return null

  const members = activeMemberships(group)
  const memberIds = members.map((m) => m.companyId)
  const myGrants = store.roleGrants.filter(
    (r) => r.groupId === group.id && r.userEmail === persona.email && !r.revoked
  )

  // Rules-engine prerequisite evaluation from live configuration (GRP-14).
  const prerequisites: Prerequisite[] = [
    {
      label: 'Companies explicitly linked via the group-company construct',
      pass: persona.companyId ? memberIds.includes(persona.companyId) : memberIds.length >= 2,
    },
    {
      label: 'Cross-company access enabled in governed configuration',
      pass: group.crossCompanyAccess,
    },
    {
      label: 'Actor holds an explicit group-level role for this group',
      pass: myGrants.length > 0,
    },
  ]
  const failing = prerequisites.find((p) => !p.pass)
  const permitted = !failing
  const hasReportingRole = myGrants.some((r) => r.role === 'Group Reporting Viewer')

  const runReport = () => {
    if (failing) {
      toast.error(`Rules engine: DENY — failing condition: ${failing.label}`)
      setReportOpen(false)
      return
    }
    if (!hasReportingRole) {
      toast.error('Denied — consolidated reporting requires the Group Reporting Viewer role')
      setReportOpen(false)
      return
    }
    setReportOpen(true)
    record({
      action: 'CONSOLIDATED_REPORT_RUN',
      category: 'reporting',
      groupCode: group.code,
      detail: `Headcount + leave/attendance report across ${members.length} member companies (row-level security applied)`,
    })
    toast.success('Rules engine: PERMIT — consolidated report generated under row-level security')
  }

  const runSearch = () => {
    const crossCompany = permitted
    const scopeIds = crossCompany
      ? memberIds
      : persona.companyId
        ? [persona.companyId]
        : []
    const q = query.trim().toLowerCase()
    const matches = seedDirectory.filter(
      (p) =>
        scopeIds.includes(p.companyId) &&
        (q === '' ||
          p.name.toLowerCase().includes(q) ||
          p.title.toLowerCase().includes(q) ||
          p.department.toLowerCase().includes(q))
    )
    const visible = matches.filter((p) => isPlatform || !p.restricted)
    setSearched({
      scope: crossCompany
        ? `${members.length} linked companies`
        : 'own company only (prerequisites not met)',
      ids: visible.map((p) => p.id),
      withheld: matches.length - visible.length,
    })
    record({
      action: 'DIRECTORY_SEARCH',
      category: 'directory',
      groupCode: crossCompany ? group.code : null,
      detail: `Directory search "${query || '*'}" — ${visible.length} results, ${matches.length - visible.length} row(s) withheld by RLS, scope: ${crossCompany ? 'cross-company' : 'own company'}`,
    })
    if (!crossCompany) {
      toast.info(`Results limited to your own company — ${failing?.label ?? 'prerequisite'} not met`)
    }
  }

  const results = searched
    ? seedDirectory.filter((p) => searched.ids.includes(p.id))
    : []

  return (
    <div className='w-full space-y-4'>
      <div className='flex flex-wrap items-center gap-3'>
        <span className='text-paragraph-sm text-neutral-1000'>Group construct</span>
        <Select value={group.id} onValueChange={(v) => { setGroupId(v); setReportOpen(false); setSearched(null) }}>
          <SelectTrigger variant='secondary' className='h-8 w-72'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {store.groups.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.code} — {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant='open'>
          Acting as {persona.name} ({myGrants.length} group-level role
          {myGrants.length === 1 ? '' : 's'})
        </Badge>
      </div>

      <Card className='gap-3 border-gray-200 py-4'>
        <CardHeader className='flex flex-wrap items-center justify-between gap-2 px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Rules-engine decision — prerequisites evaluated from configuration, not per-feature code
          </CardTitle>
          <Badge variant={permitted ? 'qualified' : 'disqualified'}>
            {permitted ? 'PERMIT' : `DENY — ${failing?.label}`}
          </Badge>
        </CardHeader>
        <CardContent className='space-y-2 px-4'>
          {prerequisites.map((p) => (
            <div
              key={p.label}
              className='flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2'
            >
              <span className='text-sm'>{p.label}</span>
              <Badge variant={p.pass ? 'completed' : 'badge_inactive'}>
                {p.pass ? 'true' : 'false'}
              </Badge>
            </div>
          ))}
          <p className='text-paragraph-sm text-neutral-1000'>
            Config changes (Sharing & Roles tab) are picked up on the next
            evaluation without a code change. Permitted requests still run
            under row-level security and are written to the audit trail.
          </p>
        </CardContent>
      </Card>

      <Card className='gap-3 border-gray-200 py-4'>
        <CardHeader className='flex flex-wrap items-center justify-between gap-2 px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Consolidated group reporting (Group Reporting Viewer role required)
          </CardTitle>
          <Button size='sm' className='h-8' onClick={runReport}>
            Run consolidated report
          </Button>
        </CardHeader>
        {reportOpen && (
          <CardContent className='space-y-3 px-4'>
            <div className='flex flex-wrap gap-2'>
              <Badge variant='open'>
                Aggregated headcount:{' '}
                {members
                  .reduce(
                    (n, m) =>
                      n + (store.companies.find((c) => c.id === m.companyId)?.headcount ?? 0),
                    0
                  )
                  .toLocaleString('en-US')}
              </Badge>
              <Badge variant='qualified'>Row-level security applied</Badge>
              <Badge variant='pending'>Non-members excluded from aggregates</Badge>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member company (org structure)</TableHead>
                  <TableHead>Relationship</TableHead>
                  <TableHead>Headcount</TableHead>
                  <TableHead>On leave today</TableHead>
                  <TableHead>Attendance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...members]
                  .sort((a, b) =>
                    a.companyId === group.parentCompanyId ? -1 : b.companyId === group.parentCompanyId ? 1 : 0
                  )
                  .map((m) => {
                    const c = store.companies.find((x) => x.id === m.companyId)
                    const isParent = m.companyId === group.parentCompanyId
                    return (
                      <TableRow key={m.id}>
                        <TableCell className='text-sm font-medium'>
                          <span className={isParent ? '' : 'pl-5'}>
                            {isParent ? '' : '└ '}
                            {store.companyName(m.companyId)}
                          </span>
                        </TableCell>
                        <TableCell className='text-sm'>{m.relationshipType}</TableCell>
                        <TableCell className='text-sm'>{c?.headcount.toLocaleString('en-US')}</TableCell>
                        <TableCell className='text-sm'>{c?.onLeaveToday}</TableCell>
                        <TableCell className='text-sm'>{c?.attendancePct}%</TableCell>
                      </TableRow>
                    )
                  })}
              </TableBody>
            </Table>
          </CardContent>
        )}
      </Card>

      <Card className='gap-3 border-gray-200 py-4'>
        <CardHeader className='px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Cross-company directory search — scoped by authorization, filtered by RLS, audited
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3 px-4'>
          <div className='flex flex-wrap items-center gap-3'>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Search people by name, title or department…'
              className='h-8 w-80'
              onKeyDown={(e) => e.key === 'Enter' && runSearch()}
            />
            <Button size='sm' className='h-8' onClick={runSearch}>
              Search directory
            </Button>
            {searched && (
              <>
                <Badge variant='open'>Scope: {searched.scope}</Badge>
                {searched.withheld > 0 && (
                  <Badge variant='overdue'>
                    {searched.withheld} row{searched.withheld > 1 ? 's' : ''} withheld by row-level security
                  </Badge>
                )}
              </>
            )}
          </div>
          {searched && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className='text-sm font-medium'>{p.name}</TableCell>
                    <TableCell className='text-sm'>{p.title}</TableCell>
                    <TableCell className='text-sm'>{p.department}</TableCell>
                    <TableCell className='text-sm'>{store.companyName(p.companyId)}</TableCell>
                    <TableCell className='text-paragraph-sm text-neutral-1000'>{p.email}</TableCell>
                  </TableRow>
                ))}
                {results.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className='text-neutral-1000 text-center'>
                      No results within your authorized scope
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
