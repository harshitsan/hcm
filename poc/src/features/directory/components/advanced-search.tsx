import { useMemo } from 'react'
import { MagnifyingGlass, XCircle } from 'phosphor-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  EMPLOYMENT_STATUSES,
  type Company,
  type Employee,
} from '../data/directory'
import { type CustomFieldDef } from '../data/directory-config'
import {
  countActiveFilters,
  EMPTY_FILTERS,
  type DirectoryFilters,
} from '../data/filters'

interface AdvancedSearchProps {
  filters: DirectoryFilters
  onChange: (filters: DirectoryFilters) => void
  /** Employees in the caller's tenant scope — facet options derive from them. */
  employees: Employee[]
  /** Custom fields flagged searchable render as dynamic filters (DIR-20/22). */
  customFields: CustomFieldDef[]
  /** More than one company ⇒ cross-company scope with a company facet (DIR-09). */
  companies: Company[]
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  'on-leave': 'On leave',
  contractor: 'Contractor',
  inactive: 'Deactivated',
}

function FacetSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger variant='secondary' className='h-8 w-full text-xs'>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value='all'>{label}: All</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/**
 * Advanced search (DIR-06): name/ID query plus department, position,
 * location, group, employment status, company and custom-field facets —
 * all combined with AND.
 */
export function AdvancedSearch({
  filters,
  onChange,
  employees,
  customFields,
  companies,
}: AdvancedSearchProps) {
  const { departments, positions, locations, workGroups } = useMemo(() => {
    const facet = (pick: (e: Employee) => string) =>
      Array.from(new Set(employees.map(pick))).sort()
    return {
      departments: facet((e) => e.department),
      positions: facet((e) => e.position),
      locations: facet((e) => e.location),
      workGroups: facet((e) => e.workGroup),
    }
  }, [employees])

  const searchableCustom = customFields.filter(
    (f) => f.searchable && !f.sensitive
  )
  const activeCount = countActiveFilters(filters)

  const set = (patch: Partial<DirectoryFilters>) =>
    onChange({ ...filters, ...patch })

  return (
    <div className='mb-3 rounded-[6px] border border-gray-200 bg-white p-3'>
      <div className='flex flex-wrap items-center gap-2'>
        <div className='relative min-w-[220px] flex-1'>
          <MagnifyingGlass
            size={14}
            className='text-neutral-1000 absolute top-1/2 left-2 -translate-y-1/2'
          />
          <Input
            value={filters.query}
            onChange={(e) => set({ query: e.target.value })}
            placeholder='Search by name or employee ID…'
            className='h-8 pl-7 text-sm'
          />
        </div>
        {activeCount > 0 && (
          <Button
            variant='outline'
            className='h-8 gap-1 px-2 text-xs'
            onClick={() => onChange({ ...EMPTY_FILTERS })}
          >
            <XCircle size={13} />
            Clear filters ({activeCount})
          </Button>
        )}
      </div>

      <div className='mt-2 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6'>
        {companies.length > 1 && (
          <FacetSelect
            label='Company'
            value={filters.companyId}
            options={companies.map((c) => ({ value: c.id, label: c.name }))}
            onChange={(v) => set({ companyId: v })}
          />
        )}
        <FacetSelect
          label='Department'
          value={filters.department}
          options={departments.map((d) => ({ value: d, label: d }))}
          onChange={(v) => set({ department: v })}
        />
        <FacetSelect
          label='Position'
          value={filters.position}
          options={positions.map((p) => ({ value: p, label: p }))}
          onChange={(v) => set({ position: v })}
        />
        <FacetSelect
          label='Location'
          value={filters.location}
          options={locations.map((l) => ({ value: l, label: l }))}
          onChange={(v) => set({ location: v })}
        />
        <FacetSelect
          label='Group'
          value={filters.workGroup}
          options={workGroups.map((g) => ({ value: g, label: g }))}
          onChange={(v) => set({ workGroup: v })}
        />
        <FacetSelect
          label='Status'
          value={filters.employmentStatus}
          options={EMPLOYMENT_STATUSES.map((s) => ({
            value: s,
            label: STATUS_LABELS[s],
          }))}
          onChange={(v) => set({ employmentStatus: v })}
        />
        {/* Dynamic custom-field filters generated from the schema (DIR-22). */}
        {searchableCustom.map((f) =>
          f.type === 'select' ? (
            <FacetSelect
              key={f.id}
              label={f.label}
              value={filters.custom[f.id] ?? 'all'}
              options={(f.options ?? []).map((o) => ({ value: o, label: o }))}
              onChange={(v) =>
                set({ custom: { ...filters.custom, [f.id]: v } })
              }
            />
          ) : (
            <Input
              key={f.id}
              value={filters.custom[f.id] ?? ''}
              onChange={(e) =>
                set({ custom: { ...filters.custom, [f.id]: e.target.value } })
              }
              placeholder={f.label}
              className='h-8 text-sm'
            />
          )
        )}
      </div>
    </div>
  )
}
