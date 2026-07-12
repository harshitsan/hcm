import { useMemo, useState } from 'react'
import { DownloadSimple } from 'phosphor-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRole } from '@/context/role-context'
import {
  DEPARTMENTS,
  getStatutory,
  LIFECYCLE_STAGES,
  LOCATIONS,
  companyName,
  type Employee,
} from '../data/employees'

type Dimension = 'department' | 'location' | 'stage' | 'company'

const DIMENSION_LABELS: Record<Dimension, string> = {
  department: 'Department',
  location: 'Location',
  stage: 'Lifecycle stage',
  company: 'Company',
}

interface HeadcountRow {
  group: string
  headcount: number
  active: number
  inPipeline: number
  exited: number
}

/** Group keys an employee record contributes to for a dimension. */
function groupKeys(e: Employee, dimension: Dimension): string[] {
  switch (dimension) {
    case 'department':
      return e.departments
    case 'location':
      return e.locations
    case 'stage':
      return [e.lifecycleStage]
    case 'company':
      return [companyName(e.companyId)]
  }
}

/** Canonical group order per dimension (configured lists first). */
function groupOrder(dimension: Dimension, groups: string[]): string[] {
  const canonical: readonly string[] =
    dimension === 'department'
      ? DEPARTMENTS
      : dimension === 'location'
        ? LOCATIONS
        : dimension === 'stage'
          ? LIFECYCLE_STAGES
          : []
  const known = canonical.filter((g) => groups.includes(g))
  const rest = groups.filter((g) => !canonical.includes(g)).sort()
  return [...known, ...rest]
}

/**
 * Reports — per-module reporting deliverable (conventions §8): headcount
 * breakdowns by department / location / lifecycle stage / company over the
 * role-scoped directory, with CSV export for compliance and analysis.
 */
export function ReportsTab({
  employees,
  scopeLabel,
}: {
  employees: Employee[]
  scopeLabel: string
}) {
  const { hasRole } = useRole()
  const [dimension, setDimension] = useState<Dimension>('department')
  // Comp-dark (W1): compensation columns leave the module only for HR admin
  // roles — every other exporting role gets the file without them.
  const canExportCompensation = hasRole('Company Admin', 'Platform Admin')

  const rows = useMemo<HeadcountRow[]>(() => {
    const byGroup = new Map<string, Employee[]>()
    for (const e of employees) {
      for (const key of groupKeys(e, dimension)) {
        byGroup.set(key, [...(byGroup.get(key) ?? []), e])
      }
    }
    return groupOrder(dimension, [...byGroup.keys()]).map((group) => {
      const members = byGroup.get(group) ?? []
      return {
        group,
        headcount: members.length,
        active: members.filter((e) => e.lifecycleStage === 'Active').length,
        inPipeline: members.filter((e) =>
          ['Onboarding', 'Probation'].includes(e.lifecycleStage)
        ).length,
        exited: members.filter((e) => e.lifecycleStage === 'Exited').length,
      }
    })
  }, [employees, dimension])

  const exportCsv = () => {
    const header = [
      DIMENSION_LABELS[dimension],
      'Headcount',
      'Active',
      'Onboarding / Probation',
      'Exited',
    ]
    const lines = rows.map((r) =>
      [
        r.group.replaceAll(',', ';'),
        r.headcount,
        r.active,
        r.inPipeline,
        r.exited,
      ].join(',')
    )
    const csv = [header.join(','), ...lines].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `employees-headcount-by-${dimension}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(
      `Exported headcount by ${DIMENSION_LABELS[dimension].toLowerCase()} — ${rows.length} row(s)`
    )
  }

  /** CSV-safe cell — quoted, inner quotes doubled. */
  const csvCell = (v: string | number) => `"${String(v).replaceAll('"', '""')}"`

  const exportRecordsCsv = () => {
    const header = [
      'Code',
      'Name',
      'Company',
      'Jurisdiction',
      'Departments',
      'Position',
      'Lifecycle stage',
      'PF eligible',
      'ESI eligible',
      'PT registration',
      'LWF applicable',
      ...(canExportCompensation
        ? ['Annual CTC', 'Fixed pay', 'Variable pay', 'Comp last revised']
        : []),
    ]
    const lines = employees.map((e) => {
      const statutory = getStatutory(e)
      return [
        e.code,
        e.name,
        companyName(e.companyId),
        e.jurisdiction,
        e.departments.join('; '),
        e.position,
        e.lifecycleStage,
        statutory.pfEligible ? 'Yes' : 'No',
        statutory.esiEligible ? 'Yes' : 'No',
        statutory.ptRegistration ?? '—',
        statutory.lwfApplicable ? 'Yes' : 'No',
        ...(canExportCompensation
          ? [
              e.compensation?.annualCtc ?? '—',
              e.compensation?.fixedPay ?? '—',
              e.compensation?.variablePay ?? '—',
              e.compensation?.lastRevisedOn ?? '—',
            ]
          : []),
      ]
        .map(csvCell)
        .join(',')
    })
    const csv = [header.map(csvCell).join(','), ...lines].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'employee-records.csv'
    a.click()
    URL.revokeObjectURL(url)
    toast.success(
      canExportCompensation
        ? `Exported ${employees.length} employee record(s) — compensation columns included (HR admin role)`
        : `Exported ${employees.length} employee record(s) — compensation columns excluded (comp-dark policy)`
    )
  }

  return (
    <div className='w-full'>
      <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          Headcount reports
          <span className='text-neutral-1000 ml-2 text-xs'>
            scope: {scopeLabel}
          </span>
        </h2>
        <div className='flex items-center gap-2'>
          <Select
            value={dimension}
            onValueChange={(v) => setDimension(v as Dimension)}
          >
            <SelectTrigger variant='secondary' className='h-7 w-[190px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(DIMENSION_LABELS) as Dimension[]).map((d) => (
                <SelectItem key={d} value={d}>
                  By {DIMENSION_LABELS[d].toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant='outline' className='h-7 gap-1' onClick={exportCsv}>
            <DownloadSimple size={14} weight='bold' />
            Export CSV
          </Button>
          <Button
            variant='outline'
            className='h-7 gap-1'
            onClick={exportRecordsCsv}
          >
            <DownloadSimple size={14} weight='bold' />
            Export records
          </Button>
        </div>
      </div>

      <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='text-neutral-1000 border-b text-left text-xs'>
              <th className='py-2 pr-3 font-medium'>
                {DIMENSION_LABELS[dimension]}
              </th>
              <th className='px-2 font-medium'>Headcount</th>
              <th className='px-2 font-medium'>Active</th>
              <th className='px-2 font-medium'>Onboarding / Probation</th>
              <th className='px-2 font-medium'>Exited</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.group} className='border-b last:border-0'>
                <td className='py-2 pr-3 font-medium'>{r.group}</td>
                <td className='px-2 font-semibold'>{r.headcount}</td>
                <td className='px-2'>{r.active}</td>
                <td className='px-2'>{r.inPipeline}</td>
                <td className='px-2'>{r.exited}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className='text-neutral-1000 mt-3 text-xs'>
          Counts are over your role-scoped directory ({employees.length}{' '}
          record(s)). Department and location breakdowns count an employee once
          per assignment, so totals can exceed headcount. The records export{' '}
          {canExportCompensation
            ? 'includes compensation columns for your HR admin role.'
            : 'excludes compensation columns — comp-dark data is limited to HR administrators.'}
        </p>
      </div>
    </div>
  )
}
