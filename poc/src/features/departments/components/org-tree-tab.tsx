import { useMemo, useState } from 'react'
import { CaretDown, CaretRight, MagnifyingGlass } from 'phosphor-react'
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
import { useRole } from '@/context/role-context'
import {
  COMPANIES,
  CURRENT_COMPANY_ID,
  CURRENT_GROUP,
  type Department,
} from '../data/departments'
import { LOCATIONS } from '../data/org-config'
import { type CustomFieldDef } from '../data/governance'
import { type DepartmentsStore } from '../hooks/use-departments'
import { DepartmentStatusBadge } from './department-badges'

interface OrgTreeTabProps {
  store: DepartmentsStore
  customFields: CustomFieldDef[]
}

/**
 * Metadata-driven, collapsible n-level org tree with search (DEPT-18).
 * Group Company Admins see every company in their group (DEPT-10) and
 * Portfolio / Platform Admins every company in the portfolio (DEPT-19) —
 * each hierarchy stays isolated to its owning company.
 */
export function OrgTreeTab({ store, customFields }: OrgTreeTabProps) {
  const { role } = useRole()

  // Tenant scoping: which companies is this role allowed to govern?
  const visibleCompanies = useMemo(() => {
    if (role === 'Platform Admin' || role === 'Portfolio Admin') return COMPANIES
    if (role === 'Group Company Admin')
      return COMPANIES.filter((c) => c.group === CURRENT_GROUP)
    return COMPANIES.filter((c) => c.id === CURRENT_COMPANY_ID)
  }, [role])

  const [companyId, setCompanyId] = useState(visibleCompanies[0]?.id ?? CURRENT_COMPANY_ID)
  const [search, setSearch] = useState('')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const activeCompanyId = visibleCompanies.some((c) => c.id === companyId)
    ? companyId
    : (visibleCompanies[0]?.id ?? CURRENT_COMPANY_ID)

  const companyDepts = useMemo(
    () => store.departments.filter((d) => d.companyId === activeCompanyId),
    [store.departments, activeCompanyId]
  )

  const matches = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return new Set<string>()
    return new Set(
      companyDepts
        .filter((d) => {
          const head = d.headId ? store.employeeById.get(d.headId)?.name ?? '' : ''
          return (
            d.name.toLowerCase().includes(q) ||
            d.acronym.toLowerCase().includes(q) ||
            head.toLowerCase().includes(q)
          )
        })
        .map((d) => d.id)
    )
  }, [search, companyDepts, store.employeeById])

  const toggleCollapse = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selected = selectedId ? companyDepts.find((d) => d.id === selectedId) ?? null : null

  const renderNode = (dept: Department, depth: number): React.ReactNode => {
    const children = companyDepts.filter((d) => d.parentId === dept.id)
    // While searching, auto-expand so matches are visible in place.
    const isCollapsed = search ? false : collapsed.has(dept.id)
    const isMatch = matches.has(dept.id)
    const head = dept.headId ? store.employeeById.get(dept.headId) : undefined
    return (
      <div key={dept.id}>
        <button
          type='button'
          onClick={() => setSelectedId(dept.id)}
          className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
            selectedId === dept.id
              ? 'bg-blue-150 text-blue-1400'
              : isMatch
                ? 'bg-vanilla-400/40'
                : 'hover:bg-neutral-200'
          }`}
          style={{ paddingLeft: `${depth * 20 + 8}px` }}
        >
          {children.length > 0 ? (
            <span
              role='button'
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation()
                toggleCollapse(dept.id)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') toggleCollapse(dept.id)
              }}
              className='text-neutral-1000'
            >
              {isCollapsed ? <CaretRight size={12} weight='bold' /> : <CaretDown size={12} weight='bold' />}
            </span>
          ) : (
            <span className='w-3' />
          )}
          <span className='text-neutral-1600 font-medium'>{dept.name}</span>
          {dept.acronym && <Badge variant='secondary'>{dept.acronym}</Badge>}
          <span className='text-neutral-1000 text-xs'>
            {store.directMembersOf(dept.id).length} members
            {head ? ` · Head: ${head.name}` : ''}
          </span>
          {dept.status === 'inactive' && <DepartmentStatusBadge status='inactive' />}
        </button>
        {!isCollapsed && children.map((c) => renderNode(c, depth + 1))}
      </div>
    )
  }

  const roots = companyDepts.filter((d) => d.parentId === null)

  return (
    <div className='grid gap-4 lg:grid-cols-[1.4fr_1fr]'>
      <Card className='border-gray-200'>
        <CardHeader className='space-y-3'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Organization tree
          </CardTitle>
          <div className='flex flex-wrap items-center gap-2'>
            {visibleCompanies.length > 1 && (
              <Select value={activeCompanyId} onValueChange={setCompanyId}>
                <SelectTrigger variant='secondary' className='w-[240px]'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {visibleCompanies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} — {c.group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className='relative flex-1'>
              <MagnifyingGlass
                size={14}
                className='text-neutral-1000 absolute top-1/2 left-2 -translate-y-1/2'
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder='Search by department name, acronym or head…'
                className='pl-7'
              />
            </div>
          </div>
          {visibleCompanies.length > 1 && (
            <p className='text-neutral-1000 text-xs'>
              Oversight view — each hierarchy is isolated to its owning company; you are
              viewing it for governance only.
            </p>
          )}
        </CardHeader>
        <CardContent>
          {roots.length === 0 ? (
            <p className='text-neutral-1000 text-sm'>No departments defined yet.</p>
          ) : (
            <div className='space-y-0.5'>{roots.map((r) => renderNode(r, 0))}</div>
          )}
          {search && matches.size === 0 && (
            <p className='text-neutral-1000 mt-2 text-sm'>No departments match “{search}”.</p>
          )}
        </CardContent>
      </Card>

      <Card className='border-gray-200'>
        <CardHeader>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Department detail
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selected ? (
            <p className='text-neutral-1000 text-sm'>
              Select a department node to inspect its head, hierarchy, custom fields and
              membership without leaving this page.
            </p>
          ) : (
            <div className='space-y-3 text-sm'>
              <div className='flex items-center gap-2'>
                <span className='text-neutral-1600 text-base font-semibold'>{selected.name}</span>
                {selected.acronym && <Badge variant='secondary'>{selected.acronym}</Badge>}
                <DepartmentStatusBadge status={selected.status} />
              </div>
              <p className='text-neutral-1000 font-mono text-xs'>{selected.id}</p>
              {selected.description && (
                <p className='text-neutral-1900'>{selected.description}</p>
              )}
              <DetailRow
                label='Department head'
                value={
                  selected.headId
                    ? (store.employeeById.get(selected.headId)?.name ?? 'Unknown')
                    : 'Unassigned'
                }
              />
              <DetailRow
                label='Parent context'
                value={
                  [selected, ...store.ancestorsOf(selected.id)]
                    .reverse()
                    .map((d) => d.name)
                    .join(' › ') || selected.name
                }
              />
              <DetailRow
                label='Child departments'
                value={
                  store.childrenOf(selected.id).map((c) => c.name).join(', ') || 'None'
                }
              />
              <DetailRow
                label='Members (direct / incl. children)'
                value={`${store.directMembersOf(selected.id).length} / ${store.rolledUpMembersOf(selected.id).length}`}
              />
              <DetailRow
                label='Locations'
                value={
                  selected.locationIds
                    .map((id) => LOCATIONS.find((l) => l.id === id)?.name ?? id)
                    .join(', ') || 'None'
                }
              />
              {customFields.length > 0 && selected.companyId === CURRENT_COMPANY_ID && (
                <div className='rounded-md border border-gray-200 p-2'>
                  <p className='text-neutral-1600 mb-1 font-medium'>Custom fields (from config)</p>
                  {customFields.map((f) => (
                    <DetailRow
                      key={f.id}
                      label={`${f.label} (v${f.version})`}
                      value={selected.customFields[f.id] || '—'}
                    />
                  ))}
                </div>
              )}
              <Button variant='outline' className='h-7 px-2 text-xs' onClick={() => setSelectedId(null)}>
                Close detail
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex items-start justify-between gap-3'>
      <span className='text-neutral-1000'>{label}</span>
      <span className='text-neutral-1900 text-right font-medium'>{value}</span>
    </div>
  )
}
