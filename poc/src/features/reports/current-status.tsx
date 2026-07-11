import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, MagnifyingGlass, Prohibit } from 'phosphor-react'
import { useRole } from '@/context/role-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable } from '@/components/common/data-table/table'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { currentStatusColumns } from './components/current-status-columns'
import { seedCurrentStatus } from './data/current-status'
import { companiesForRole } from './data/governance'
import { DEPARTMENTS, LOCATIONS } from './data/report-catalog'
import { useGrants } from './hooks/use-grants'

interface Filters {
  location: string
  department: string
  project: string
  name: string
}

const EMPTY: Filters = {
  location: 'all',
  department: 'all',
  project: '',
  name: '',
}

/**
 * Real-time Employee Current Status screen (RPT-44): filter by location,
 * department, project and employee name, search, and reset — scoped to the
 * viewer's authorized companies.
 */
export function EmployeeCurrentStatus() {
  const { role, hasRole } = useRole()
  // Same live RLS grant scoping as the main reports surface (RPT-20).
  const grants = useGrants()
  const companies = useMemo(
    () => companiesForRole(role, grants),
    [role, grants]
  )

  const [draft, setDraft] = useState<Filters>(EMPTY)
  const [applied, setApplied] = useState<Filters>(EMPTY)

  const canView = hasRole(
    'Company Admin',
    'Group Company Admin',
    'Portfolio Admin',
    'Platform Admin'
  )

  const rows = useMemo(
    () =>
      seedCurrentStatus.filter(
        (r) =>
          companies.includes(r.company) &&
          (applied.location === 'all' || r.location === applied.location) &&
          (applied.department === 'all' ||
            r.department === applied.department) &&
          r.project.toLowerCase().includes(applied.project.toLowerCase()) &&
          r.name.toLowerCase().includes(applied.name.toLowerCase())
      ),
    [companies, applied]
  )

  const reset = () => {
    setDraft(EMPTY)
    setApplied(EMPTY)
  }

  return (
    <>
      <CommonHeader title='Employee Current Status' className='bg-blue-150' />
      <Main fluid className='bg-neutral-200'>
        <div className='w-full'>
          {!canView ? (
            <div className='flex items-start gap-3 rounded-[8px] border border-gray-200 bg-white p-5'>
              <Prohibit
                size={20}
                weight='bold'
                className='text-neutral-1000 mt-0.5 shrink-0'
              />
              <p className='text-neutral-1600 text-sm'>
                The Employee Current Status screen is available to admins only.
              </p>
            </div>
          ) : (
            <>
              <div className='mb-3 flex flex-wrap items-end justify-between gap-2'>
                <div className='flex flex-wrap items-end gap-2'>
                  <Select
                    value={draft.location}
                    onValueChange={(v) =>
                      setDraft((d) => ({ ...d, location: v }))
                    }
                  >
                    <SelectTrigger
                      variant='secondary'
                      className='h-7 w-[150px]'
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All locations</SelectItem>
                      {LOCATIONS.map((l) => (
                        <SelectItem key={l} value={l}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={draft.department}
                    onValueChange={(v) =>
                      setDraft((d) => ({ ...d, department: v }))
                    }
                  >
                    <SelectTrigger
                      variant='secondary'
                      className='h-7 w-[170px]'
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All departments</SelectItem>
                      {DEPARTMENTS.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={draft.project}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, project: e.target.value }))
                    }
                    placeholder='Project'
                    className='h-7 w-[150px]'
                  />
                  <Input
                    value={draft.name}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, name: e.target.value }))
                    }
                    placeholder='Employee name'
                    className='h-7 w-[170px]'
                  />
                  <Button
                    className='h-7 gap-1'
                    onClick={() => setApplied(draft)}
                  >
                    <MagnifyingGlass size={14} weight='bold' />
                    Search
                  </Button>
                  <Button variant='outline' className='h-7' onClick={reset}>
                    Reset
                  </Button>
                </div>
                <Button asChild variant='outline' className='h-7 gap-1'>
                  <Link to='/reports'>
                    <ArrowLeft size={14} weight='bold' />
                    Back to Reports
                  </Link>
                </Button>
              </div>

              <p className='text-neutral-1000 mb-2 text-xs'>
                {rows.length} employee(s) · live status across{' '}
                {companies.length > 0
                  ? companies.join(', ')
                  : 'no companies (all grants revoked)'}
              </p>

              <DataTable
                columns={currentStatusColumns}
                data={rows}
                variant='no-status'
              />
            </>
          )}
        </div>
      </Main>
    </>
  )
}
