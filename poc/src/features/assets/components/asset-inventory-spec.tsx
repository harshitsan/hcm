import type { TableSpec } from '@/components/common/data-table'
import { type Asset } from '../data/assets'
import { employeeName, formatInr } from '../data/org'
import { daysOverdue } from './asset-columns'
import { AssetStateBadge, OverdueBadge } from './badges'

interface AssetInventorySpecOpts {
  today: string
  showCompany: boolean
}

/** Inventory grid (ASM-01/02/11/12/13/36/41). Filtering stays external —
 * bespoke category/state/vendor/company/date filters live in inventory-tab.tsx
 * and produce `filtered`; this spec only drives the grid columns, custom-
 * columns menu and row expansion. No inline actions — all transactions are
 * selection-driven via AssetFormOverlay/TransactionDialog. */
export function assetInventorySpec(opts: AssetInventorySpecOpts): TableSpec<Asset> {
  const columns: TableSpec<Asset>['columns'] = [
    {
      id: 'assetTag',
      header: 'Asset ID',
      type: 'string',
      required: true,
      accessor: (a) => a.assetTag,
    },
    {
      id: 'name',
      header: 'Asset',
      type: 'string',
      accessor: (a) => a.name,
    },
    {
      id: 'category',
      header: 'Category',
      type: 'string',
      accessor: (a) => a.category,
    },
    {
      id: 'state',
      header: 'State',
      type: 'badge',
      accessor: (a) => a.state,
      cell: (a) => (
        <div className='flex items-center gap-1.5'>
          <AssetStateBadge state={a.state} />
          <OverdueBadge daysOverdue={daysOverdue(a, opts.today)} />
        </div>
      ),
    },
    {
      id: 'holder',
      header: 'Held by',
      type: 'string',
      accessor: (a) => employeeName(a.holderId),
    },
    {
      id: 'value',
      header: 'Value',
      type: 'number',
      accessor: (a) => a.value,
      cell: (a) => <span className='text-neutral-1900 text-sm'>{formatInr(a.value)}</span>,
    },
  ]

  if (opts.showCompany) {
    columns.push({
      id: 'company',
      header: 'Company',
      type: 'string',
      accessor: (a) => a.company,
    })
  }

  columns.push({
    id: 'vendor',
    header: 'Vendor',
    type: 'string',
    detail: true,
    accessor: (a) => a.vendor,
  })

  return {
    id: 'asset-inventory',
    defaultSort: { id: 'assetTag', dir: 'asc' },
    columns,
  }
}
