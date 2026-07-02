import { useMemo, useState } from 'react'
import { CaretDown, ClockCounterClockwise, PencilSimple, Plus } from 'phosphor-react'
import { useRole } from '@/context/role-context'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable } from '@/components/common/data-table/table'
import { ACTION_LABELS, ASSET_STATES, type Asset, type AssetAction } from '../data/assets'
import {
  EMPLOYEES,
  HOME_COMPANY,
  formatInr,
  todayIso,
  visibleCompanies,
} from '../data/org'
import { type AssetConfigStore } from '../hooks/use-asset-config'
import { type AssetsStore } from '../hooks/use-assets'
import { assetTableColumns, daysOverdue } from './asset-columns'
import { AssetFormOverlay } from './asset-form-overlay'
import { AssetHistoryOverlay } from './asset-history-overlay'
import { SummaryCards } from './summary-cards'
import { TransactionDialog } from './transaction-dialog'

const ALL_ACTIONS: AssetAction[] = [
  'issue',
  'loan',
  'transfer',
  'return',
  'recover',
  'mark-available',
  'send-repair',
  'repair-complete',
  'retire',
  'dispose',
]

interface InventoryTabProps {
  store: AssetsStore
  config: AssetConfigStore
}

/**
 * Asset inventory (ASM-01/02/11/12/13/36/41): register/edit, category and
 * state filters, lifecycle transactions via the decision table, and the
 * append-only history view. Oversight roles get read-consistent, company-
 * dimensioned visibility without operational actions (ASM-16/18/26).
 */
export function InventoryTab({ store, config }: InventoryTabProps) {
  const { role } = useRole()
  const isCompanyAdmin = role === 'Company Admin'
  const scope = visibleCompanies(role)
  const showCompany = scope.length > 1

  const [selectedRows, setSelectedRows] = useState<Asset[]>([])
  const [resetSelectionKey, setResetSelectionKey] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Asset | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [txnAction, setTxnAction] = useState<AssetAction | null>(null)

  const [categoryFilter, setCategoryFilter] = useState('All')
  const [stateFilter, setStateFilter] = useState('All')
  const [vendorFilter, setVendorFilter] = useState('')
  const [companyFilter, setCompanyFilter] = useState('All')

  const today = todayIso()

  const scoped = useMemo(
    () => store.assets.filter((a) => scope.includes(a.company)),
    [store.assets, scope]
  )

  const filtered = useMemo(
    () =>
      scoped.filter((a) => {
        if (categoryFilter !== 'All' && a.category !== categoryFilter) return false
        if (stateFilter !== 'All' && a.state !== stateFilter) return false
        if (companyFilter !== 'All' && a.company !== companyFilter) return false
        if (vendorFilter && !a.vendor.toLowerCase().includes(vendorFilter.toLowerCase()))
          return false
        return true
      }),
    [scoped, categoryFilter, stateFilter, companyFilter, vendorFilter]
  )

  const summary = useMemo(() => {
    const by = (states: Asset['state'][]) => scoped.filter((a) => states.includes(a.state)).length
    return [
      { label: 'Total assets', value: scoped.length },
      { label: 'Issuable (Available/Allocated)', value: by(['Available', 'Allocated']) },
      { label: 'With employees (Issued/Loan)', value: by(['Issued', 'Loan']) },
      {
        label: 'Value in custody',
        value: formatInr(
          scoped
            .filter((a) => a.state === 'Issued' || a.state === 'Loan' || a.state === 'Allocated')
            .reduce((sum, a) => sum + a.value, 0)
        ),
      },
    ]
  }, [scoped])

  const single = selectedRows.length === 1 ? selectedRows[0] : null
  const singleLive = single ? (store.assets.find((a) => a.id === single.id) ?? null) : null

  const clearSelection = () => {
    setSelectedRows([])
    setResetSelectionKey((k) => k + 1)
  }

  const columns = useMemo(() => assetTableColumns(today, showCompany), [today, showCompany])

  const employees = useMemo(
    () => EMPLOYEES.filter((e) => e.company === HOME_COMPANY && e.active),
    []
  )

  const overdueCount = scoped.filter((a) => daysOverdue(a, today) > 0).length

  return (
    <div className='w-full'>
      <SummaryCards title='Inventory Summary' items={summary} />

      <div className='border-grey-200 mb-3 flex flex-wrap items-end gap-3 rounded-[6px] border bg-white px-3 py-2.5'>
        <div className='flex flex-col gap-1'>
          <Label className='text-paragraph-sm'>Category</Label>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className='h-7! w-[180px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='All'>All categories</SelectItem>
              {config.categories.map((c) => (
                <SelectItem key={c.id} value={c.name}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='flex flex-col gap-1'>
          <Label className='text-paragraph-sm'>Lifecycle state</Label>
          <Select value={stateFilter} onValueChange={setStateFilter}>
            <SelectTrigger className='h-7! w-[150px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='All'>All states</SelectItem>
              {ASSET_STATES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='flex flex-col gap-1'>
          <Label htmlFor='inv-vendor' className='text-paragraph-sm'>
            Vendor
          </Label>
          <Input
            id='inv-vendor'
            value={vendorFilter}
            onChange={(e) => setVendorFilter(e.target.value)}
            placeholder='Search vendor'
            className='h-7 w-[160px]'
          />
        </div>
        {showCompany && (
          <div className='flex flex-col gap-1'>
            <Label className='text-paragraph-sm'>Company</Label>
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger className='h-7! w-[180px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='All'>All in my scope</SelectItem>
                {scope.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className='ms-auto flex items-center gap-2'>
          {overdueCount > 0 && (
            <span className='text-paragraph-sm text-red-1400'>
              {overdueCount} overdue return{overdueCount === 1 ? '' : 's'}
            </span>
          )}
          <Button
            variant='outline'
            className='h-7 rounded-[6px] px-2.5'
            onClick={() => {
              setCategoryFilter('All')
              setStateFilter('All')
              setVendorFilter('')
              setCompanyFilter('All')
            }}
          >
            Reset
          </Button>
        </div>
      </div>

      <div className='mb-3 flex items-center justify-between'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          Assets ({filtered.length})
          {!isCompanyAdmin && (
            <span className='text-paragraph-sm text-neutral-1000 ms-2 font-normal'>
              read-only oversight — transactions stay with each Company Admin
            </span>
          )}
        </h2>
        {isCompanyAdmin && (
          <div className='flex items-center gap-3'>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='outline'
                  className='h-7 gap-1 rounded-[6px] px-2'
                  disabled={!singleLive}
                >
                  Transaction
                  <CaretDown size={12} weight='bold' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='min-w-[220px]'>
                {ALL_ACTIONS.map((action) => (
                  <DropdownMenuItem key={action} onClick={() => setTxnAction(action)}>
                    {ACTION_LABELS[action]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant='icon2'
              className='text-neutral-1900 h-7 w-7'
              disabled={!singleLive}
              onClick={() => setHistoryOpen(true)}
              aria-label='History'
            >
              <ClockCounterClockwise size={16} weight='bold' />
            </Button>
            <Button
              variant='icon2'
              className='text-neutral-1900 h-7 w-7'
              disabled={!singleLive}
              onClick={() => {
                setEditing(singleLive)
                setFormOpen(true)
              }}
              aria-label='Edit'
            >
              <PencilSimple size={16} weight='fill' />
            </Button>
            <Button
              variant='red'
              onClick={() => {
                setEditing(null)
                setFormOpen(true)
              }}
              className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
            >
              <Plus size={10} weight='bold' />
              Register Asset
            </Button>
          </div>
        )}
        {!isCompanyAdmin && (
          <Button
            variant='outline'
            className='h-7 rounded-[6px] px-2.5'
            disabled={!singleLive}
            onClick={() => setHistoryOpen(true)}
          >
            View history
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        variant='no-status'
        resetSelectionKey={resetSelectionKey}
        onSelectionChange={(rows) => setSelectedRows(rows)}
      />

      <AssetFormOverlay
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditing(null)
        }}
        asset={editing}
        categories={config.categories}
        isTagTaken={(tag, excludeId) => store.isTagTaken(tag, HOME_COMPANY, excludeId)}
        onSubmit={(draft) => {
          const ok = editing
            ? store.updateAsset(editing.id, draft)
            : store.registerAsset(draft, HOME_COMPANY)
          if (ok) clearSelection()
          return ok
        }}
      />

      <TransactionDialog
        open={txnAction !== null}
        onOpenChange={(open) => {
          if (!open) setTxnAction(null)
        }}
        asset={singleLive}
        action={txnAction}
        employees={employees}
        defaultReturnDays={config.ackRules.expectedReturnDays}
        onSubmit={(assetId, action, opts) => {
          const ok = store.runTransaction(assetId, action, opts)
          if (ok) clearSelection()
          return ok
        }}
      />

      <AssetHistoryOverlay open={historyOpen} onOpenChange={setHistoryOpen} asset={singleLive} />
    </div>
  )
}
