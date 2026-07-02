import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { activeMemberships, type GroupCompany } from '../data/group-companies'

interface GroupSummaryProps {
  groups: GroupCompany[]
  auditCount: number
}

/** Count cards shown above the tabs (constructs, linked companies, scenarios, audit). */
export function GroupSummary({ groups, auditCount }: GroupSummaryProps) {
  const items = useMemo(() => {
    const linked = new Set(
      groups.flatMap((g) => activeMemberships(g).map((m) => m.companyId))
    )
    const scenariosOn = groups.reduce(
      (n, g) =>
        n +
        Number(g.sharedAdministration) +
        Number(g.sharedLocations) +
        Number(g.crossCompanyAccess),
      0
    )
    return [
      { label: 'Group constructs', value: groups.length },
      { label: 'Linked companies', value: linked.size },
      { label: 'Shared scenarios enabled', value: scenariosOn },
      { label: 'Audit events', value: auditCount },
    ]
  }, [groups, auditCount])

  return (
    <Card className='bg-blue-150 mb-4 w-full gap-2 border-none py-2'>
      <CardHeader className='flex items-center justify-between px-0 pb-2'>
        <CardTitle className='text-paragraph-sm text-neutral-1600 font-medium'>
          Group Companies Summary — tenant ten-001 (all records tenant-scoped)
        </CardTitle>
      </CardHeader>
      <CardContent className='p-0 pt-0'>
        <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
          {items.map((item) => (
            <div
              key={item.label}
              className='flex items-center rounded-[6px] border border-gray-200 bg-white px-3 py-1.5'
            >
              <div className='flex flex-col gap-4'>
                <span className='text-paragraph-sm font-medium text-black'>
                  {item.label}
                </span>
                <span className='text-3xl font-medium text-black'>
                  {item.value.toLocaleString('en-US')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
