import { useMemo } from 'react'
import { type Company } from '../data/companies'
import { SummaryCards } from '@/components/module-page'

interface CompaniesSummaryProps {
  companies: Company[]
}

/** Count cards shown above the directory (total tenants + status breakdown). */
export function CompaniesSummary({ companies }: CompaniesSummaryProps) {
  const summaryItems = useMemo(() => {
    const by = (status: Company['status']) =>
      companies.filter((c) => c.status === status).length

    return [
      { label: 'Total companies', value: companies.length },
      { label: 'Active', value: by('active') },
      { label: 'Draft', value: by('draft') },
      { label: 'Suspended', value: by('suspended') },
      { label: 'Inactive / Archived', value: by('inactive') + by('archived') },
    ]
  }, [companies])

  return <SummaryCards title='Tenant Companies Summary' items={summaryItems} />
}
