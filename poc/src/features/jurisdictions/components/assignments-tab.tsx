import { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useRole } from '@/context/role-context'
import { type Jurisdiction } from '../data/jurisdictions'
import {
  MY_COMPANY_ID,
  MY_GROUP,
  type CompanyRecord,
} from '../data/assignments'
import { type AssignmentsStore } from '../hooks/use-assignments'
import { JurisdictionPickerDialog } from './jurisdiction-picker-dialog'

interface AssignmentsTabProps {
  store: AssignmentsStore
  catalog: Jurisdiction[]
}

/**
 * Company ↔ jurisdiction assignments (JUR-06/08/09/11): Company Admin
 * manages their company, Group Company Admin their group's companies,
 * Portfolio Admin oversees all assignments read-only, Platform Admin can
 * manage everything. All selections come from the single catalog (JUR-07).
 */
export function AssignmentsTab({ store, catalog }: AssignmentsTabProps) {
  const { role } = useRole()
  const [assigningFor, setAssigningFor] = useState<CompanyRecord | null>(null)

  const catalogById = useMemo(
    () => new Map(catalog.map((j) => [j.id, j])),
    [catalog]
  )

  const visibleCompanies = useMemo(() => {
    if (role === 'Company Admin')
      return store.companies.filter((c) => c.id === MY_COMPANY_ID)
    if (role === 'Group Company Admin')
      return store.companies.filter((c) => c.group === MY_GROUP)
    return store.companies
  }, [role, store.companies])

  const canEdit = (company: CompanyRecord) => {
    if (role === 'Platform Admin') return true
    if (role === 'Company Admin') return company.id === MY_COMPANY_ID
    if (role === 'Group Company Admin') return company.group === MY_GROUP
    return false
  }

  // Portfolio oversight: which catalog jurisdictions are in use, and where.
  const coverage = useMemo(() => {
    const map = new Map<string, string[]>()
    store.companies.forEach((c) =>
      c.jurisdictionIds.forEach((jid) => {
        map.set(jid, [...(map.get(jid) ?? []), c.name])
      })
    )
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length)
  }, [store.companies])

  const scopeNote =
    role === 'Company Admin'
      ? 'Showing your company. Add or remove the jurisdictions it operates in — at least one association is always kept.'
      : role === 'Group Company Admin'
        ? `Showing the ${MY_GROUP} companies. Assign supported catalog jurisdictions per company.`
        : role === 'Portfolio Admin'
          ? 'Read-only oversight of jurisdiction coverage across every company in your portfolio.'
          : 'All company ↔ jurisdiction associations across the platform.'

  return (
    <div className='w-full space-y-4'>
      <div>
        <h2 className='text-neutral-1600 text-paragraph-md mb-1 font-medium'>
          Company operating jurisdictions ({visibleCompanies.length}{' '}
          {visibleCompanies.length === 1 ? 'company' : 'companies'})
        </h2>
        <p className='text-paragraph-sm text-neutral-1000'>{scopeNote}</p>
      </div>

      <div className='rounded-md border border-gray-200 bg-white'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>Operating jurisdictions</TableHead>
              <TableHead className='w-[130px]' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleCompanies.map((company) => (
              <TableRow key={company.id}>
                <TableCell className='font-medium'>
                  {company.name}
                  {company.id === MY_COMPANY_ID &&
                    (role === 'Company Admin' ||
                      role === 'Group Company Admin') && (
                      <span className='text-neutral-1000 block text-xs'>
                        Your company
                      </span>
                    )}
                </TableCell>
                <TableCell className='text-neutral-1000'>
                  {company.group}
                </TableCell>
                <TableCell>
                  <div className='flex flex-wrap gap-1.5'>
                    {company.jurisdictionIds.map((jid) => {
                      const j = catalogById.get(jid)
                      const isPrimary = jid === company.primaryJurisdictionId
                      const employees =
                        company.employeesByJurisdiction[jid] ?? 0
                      return (
                        <Badge
                          key={jid}
                          variant={isPrimary ? 'open' : 'pending'}
                          title={`${employees} employees in this jurisdiction`}
                        >
                          {j?.name ?? jid}
                          {isPrimary && ' · primary'}
                          {canEdit(company) && (
                            <button
                              type='button'
                              aria-label={`Remove ${j?.name ?? jid}`}
                              className='hover:text-destructive ml-0.5'
                              onClick={() =>
                                store.removeCompanyJurisdiction(company.id, jid)
                              }
                            >
                              <X className='size-3' />
                            </button>
                          )}
                        </Badge>
                      )
                    })}
                  </div>
                </TableCell>
                <TableCell>
                  {canEdit(company) ? (
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setAssigningFor(company)}
                    >
                      Assign jurisdictions
                    </Button>
                  ) : (
                    <span className='text-neutral-1000 text-xs'>View only</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {(role === 'Portfolio Admin' || role === 'Platform Admin') && (
        <div className='rounded-md border border-gray-200 bg-white px-3 py-3'>
          <p className='text-sm font-medium'>
            Portfolio coverage by jurisdiction
          </p>
          <p className='text-paragraph-sm text-neutral-1000 mb-2'>
            Every assignment draws from the same governed catalog, so coverage
            is consistent across companies.
          </p>
          <div className='space-y-1.5'>
            {coverage.map(([jid, companyNames]) => (
              <div key={jid} className='flex items-start gap-2'>
                <Badge variant='open'>{catalogById.get(jid)?.name ?? jid}</Badge>
                <span className='text-neutral-1000 pt-0.5 text-sm'>
                  {companyNames.join(', ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <JurisdictionPickerDialog
        open={assigningFor !== null}
        onOpenChange={(o) => !o && setAssigningFor(null)}
        title={`${assigningFor?.name ?? ''} — operating jurisdictions`}
        description='Select one or more supported catalog jurisdictions. A company always operates in at least one.'
        catalog={catalog}
        selectedIds={assigningFor?.jurisdictionIds ?? []}
        onSave={(ids) =>
          assigningFor
            ? store.setCompanyJurisdictions(assigningFor.id, ids)
            : false
        }
      />
    </div>
  )
}
