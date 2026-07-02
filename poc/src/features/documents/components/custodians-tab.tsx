import { useMemo, useState } from 'react'
import { ArrowsClockwise, PencilSimple, Plus, Trash } from 'phosphor-react'
import { toast } from 'sonner'
import { useRole } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { type CustodianMapping } from '../data/masters'
import {
  companiesForRole,
  CUSTODIAN_POSITIONS,
  DEPARTMENTS,
  EMPLOYEE_CLASSES,
  LOCATIONS,
} from '../data/org'
import { type MastersStore } from '../hooks/use-masters'
import { CustodianDialog } from './custodian-dialog'

type Filters = {
  location: string
  department: string
  position: string
  employeeClass: string
}

const EMPTY_FILTERS: Filters = {
  location: 'All',
  department: 'All',
  position: 'All',
  employeeClass: 'All',
}

const applicabilityLabel = (c: CustodianMapping) =>
  [
    c.location !== 'All' && `Location: ${c.location}`,
    c.department !== 'All' && `Dept: ${c.department}`,
    c.position !== 'All' && `Position: ${c.position}`,
    c.employeeClass !== 'All' && `Class: ${c.employeeClass}`,
  ]
    .filter(Boolean)
    .join(' · ') || 'All employees'

interface CustodiansTabProps {
  masters: MastersStore
}

/**
 * Document Custodian (DOC-28/29/30/31): assign an accountable custodian
 * position per document type, scoped by Location / Department / Position /
 * Employee class. Filters apply on Search and clear on Reset. Group Company
 * Admins get read-only group-wide oversight with a coverage-gap panel.
 */
export function CustodiansTab({ masters }: CustodiansTabProps) {
  const { role } = useRole()
  const canManage = role === 'Company Admin'
  const scopeCompanies = useMemo(() => companiesForRole(role), [role])

  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS)
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<CustodianMapping | null>(null)

  const rows = useMemo(() => {
    return masters.custodians
      .filter((c) => scopeCompanies.includes(c.company))
      .filter(
        (c) => applied.location === 'All' || c.location === applied.location
      )
      .filter(
        (c) =>
          applied.department === 'All' || c.department === applied.department
      )
      .filter(
        (c) => applied.position === 'All' || c.position === applied.position
      )
      .filter(
        (c) =>
          applied.employeeClass === 'All' ||
          c.employeeClass === applied.employeeClass
      )
  }, [masters.custodians, scopeCompanies, applied])

  /** Document types with no custodian per company — group oversight (DOC-31). */
  const coverageGaps = useMemo(() => {
    return scopeCompanies.map((company) => {
      const covered = new Set(
        masters.custodians
          .filter((c) => c.company === company)
          .map((c) => c.documentTypeName)
      )
      const missing = masters.documentTypes
        .map((t) => t.name)
        .filter((name) => !covered.has(name))
      return { company, covered: covered.size, missing }
    })
  }, [scopeCompanies, masters.custodians, masters.documentTypes])

  const filterSelect = (
    key: keyof Filters,
    placeholder: string,
    options: readonly string[]
  ) => (
    <Select
      value={draft[key]}
      onValueChange={(v) => setDraft((prev) => ({ ...prev, [key]: v }))}
    >
      <SelectTrigger variant='secondary' className='h-7 w-[150px]'>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value='All'>{placeholder}: All</SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  return (
    <div className='w-full'>
      <div className='mb-3 flex flex-wrap items-center gap-2'>
        {filterSelect('location', 'Location', LOCATIONS)}
        {filterSelect('department', 'Department', DEPARTMENTS)}
        {filterSelect('position', 'Position', CUSTODIAN_POSITIONS)}
        {filterSelect('employeeClass', 'Class', EMPLOYEE_CLASSES)}
        <Button className='h-7 px-3' onClick={() => setApplied(draft)}>
          Search
        </Button>
        <Button
          variant='outline'
          className='h-7 px-3'
          onClick={() => {
            setDraft(EMPTY_FILTERS)
            setApplied(EMPTY_FILTERS)
          }}
        >
          Reset
        </Button>
        <Button
          variant='icon2'
          className='text-neutral-1900 h-7 w-7'
          aria-label='Refresh'
          onClick={() =>
            toast.success('Custodian list refreshed — latest assignments shown')
          }
        >
          <ArrowsClockwise size={16} weight='bold' />
        </Button>
      </div>

      <div className='mb-3 flex items-center justify-between'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          Document custodians ({rows.length})
        </h2>
        {canManage && (
          <Button
            variant='red'
            onClick={() => {
              setEditing(null)
              setDialogOpen(true)
            }}
            className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
          >
            <Plus size={10} weight='bold' />
            New Custodian
          </Button>
        )}
      </div>

      <div className='rounded-md border bg-white'>
        <Table>
          <TableHeader>
            <TableRow className='bg-gray-50'>
              <TableHead>Document type</TableHead>
              <TableHead>Custodian position</TableHead>
              <TableHead>Applicability</TableHead>
              <TableHead>Company</TableHead>
              {canManage && (
                <TableHead className='text-right'>Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={canManage ? 5 : 4}
                  className='text-neutral-1000 h-24 text-center'
                >
                  No custodian records match the applied filters.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((custodian) => (
                <TableRow key={custodian.id}>
                  <TableCell className='text-sm font-medium'>
                    {custodian.documentTypeName}
                  </TableCell>
                  <TableCell className='text-sm'>
                    {custodian.custodianPosition}
                  </TableCell>
                  <TableCell className='text-neutral-1000 text-sm'>
                    {applicabilityLabel(custodian)}
                  </TableCell>
                  <TableCell className='text-sm'>{custodian.company}</TableCell>
                  {canManage && (
                    <TableCell>
                      <div className='flex items-center justify-end gap-2'>
                        <Button
                          variant='icon2'
                          className='text-neutral-1900 h-7 w-7'
                          aria-label='Edit'
                          onClick={() => {
                            setEditing(custodian)
                            setDialogOpen(true)
                          }}
                        >
                          <PencilSimple size={16} weight='fill' />
                        </Button>
                        <Button
                          variant='icon2'
                          className='text-neutral-1900 h-7 w-7'
                          aria-label='Delete'
                          onClick={() => masters.deleteCustodian(custodian.id)}
                        >
                          <Trash size={16} weight='bold' />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {role === 'Group Company Admin' && (
        <Card className='mt-4 gap-3 border-none bg-white py-4'>
          <CardHeader className='px-4'>
            <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
              Group-wide custodian coverage
            </CardTitle>
            <p className='text-paragraph-sm text-neutral-1000'>
              Document types without an accountable custodian position per
              group company — gaps flagged for follow-up.
            </p>
          </CardHeader>
          <CardContent className='space-y-3 px-4'>
            {coverageGaps.map((gap) => (
              <div
                key={gap.company}
                className='border-grey-200 rounded-[6px] border px-3 py-2'
              >
                <p className='text-neutral-1600 mb-1 text-sm font-medium'>
                  {gap.company} — {gap.covered} of{' '}
                  {masters.documentTypes.length} types covered
                </p>
                <div className='flex flex-wrap gap-1'>
                  {gap.missing.length === 0 ? (
                    <Badge variant='badge_active'>Full coverage</Badge>
                  ) : (
                    gap.missing.map((name) => (
                      <Badge key={name} variant='overdue'>
                        {name}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <CustodianDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditing(null)
        }}
        editing={editing}
        documentTypes={masters.documentTypes}
        companies={scopeCompanies}
        onSubmit={(values) => {
          if (editing) masters.updateCustodian(editing.id, values)
          else masters.addCustodian(values)
        }}
      />
    </div>
  )
}
