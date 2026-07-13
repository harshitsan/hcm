import { Badge } from '@/components/ui/badge'
import type { TableSpec } from '@/components/common/data-table'
import { primaryJurisdiction, type Company } from '../data/companies'

interface CompaniesTableSpecOpts {
  onAdd: () => void
  /** Gates the toolbar's Add action — omitted (or true) shows it. */
  canCreate?: boolean
}

/** §5.1 platform company directory — the reference TableSpec conversion. */
export function companiesTableSpec({
  onAdd,
  canCreate = true,
}: CompaniesTableSpecOpts): TableSpec<Company> {
  return {
    id: 'companies-directory',
    defaultSort: { id: 'legalName', dir: 'asc' },
    add: canCreate ? { label: 'New Company', onAdd } : undefined,
    columns: [
      {
        id: 'legalName',
        header: 'Company',
        type: 'string',
        required: true,
        accessor: (c) => c.legalName,
        cell: (c) => c.legalName,
      },
      {
        id: 'code',
        header: 'Code',
        type: 'string',
        accessor: (c) => c.code,
      },
      {
        id: 'jurisdiction',
        header: 'Jurisdiction',
        type: 'enum',
        filter: 'quick',
        accessor: (c) => primaryJurisdiction(c),
      },
      {
        id: 'status',
        header: 'Status',
        type: 'badge',
        filter: 'quick',
        accessor: (c) => c.status,
        cell: (c) => <Badge variant='open'>{c.status}</Badge>,
      },
      {
        id: 'employeeCount',
        header: 'Employees',
        type: 'number',
        filter: 'more',
        accessor: (c) => c.employeeCount,
      },
      {
        id: 'operatingModel',
        header: 'Operating model',
        type: 'enum',
        filter: 'more',
        default: 'hidden',
        accessor: (c) => c.operatingModel,
      },
      {
        id: 'subscriptionTier',
        header: 'Subscription',
        type: 'enum',
        detail: true,
        accessor: (c) => c.subscriptionTier,
      },
      {
        id: 'usage',
        header: 'Employees used',
        type: 'string',
        detail: true,
        accessor: (c) => `${c.employeeCount} of ${c.employeeLimit}`,
      },
      {
        id: 'baseCurrency',
        header: 'Base currency',
        type: 'enum',
        detail: true,
        accessor: (c) => c.baseCurrency,
      },
    ],
  }
}
