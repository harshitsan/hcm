import { useEffect, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Form } from '@/components/ui/form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataTable } from '@/components/common/data-table/table'
import { ASSET_CATALOG } from '../data/assets'
import {
  ARRIVAL_STATUSES,
  ASSET_VENDORS,
  REQUISITION_STATUSES,
  TEAM_ASSET_STATUSES,
  type AssetArrival,
  type TeamEmployeeAsset,
  type TeamRequisition,
} from '../data/assets-team'
import { type ArrivalDraft, type AssetsTeamStore } from '../hooks/use-assets-team'
import { SelectField, TextField } from './form-fields'
import { FilterBar, SummaryCards } from './shared'
import { StatusBadge } from './status-badge'
import { applyFilter, EMPTY_FILTER, formatDate, type PeriodStatusFilter } from './utils'

interface AssetsTeamTabProps {
  store: AssetsTeamStore
}

/** Employee name with an inactive marker, matching the other team lists. */
function EmployeeCell({ name, state }: { name: string; state: string }) {
  return (
    <span className='flex items-center gap-1.5'>
      {name}
      {state === 'Inactive' && <Badge variant='badge_inactive'>Inactive</Badge>}
    </span>
  )
}

const arrivalSchema = z.object({
  asset: z.string().min(1, 'Select an asset'),
  quantity: z.number().min(1, 'At least one unit').max(500),
  vendor: z.string().min(1, 'Select a vendor'),
  poNumber: z.string().min(3, 'Enter the purchase order number'),
})

/** New Asset Arrival intake form (Asset Tracking → Team Functions). */
function ArrivalDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (draft: ArrivalDraft) => void
}) {
  const form = useForm<z.infer<typeof arrivalSchema>>({
    resolver: zodResolver(arrivalSchema),
    defaultValues: {
      asset: ASSET_CATALOG[0],
      quantity: 1,
      vendor: ASSET_VENDORS[0],
      poNumber: '',
    },
  })

  useEffect(() => {
    if (open) form.reset()
  }, [open, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[440px]'>
        <DialogHeader>
          <DialogTitle>New asset arrival</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => {
              onSubmit(values)
              onOpenChange(false)
            })}
            className='space-y-3'
          >
            <SelectField
              control={form.control}
              name='asset'
              label='Asset'
              options={ASSET_CATALOG}
            />
            <div className='grid grid-cols-2 gap-3'>
              <TextField
                control={form.control}
                name='quantity'
                label='Quantity'
                type='number'
              />
              <TextField
                control={form.control}
                name='poNumber'
                label='PO number'
              />
            </div>
            <SelectField
              control={form.control}
              name='vendor'
              label='Vendor'
              options={ASSET_VENDORS}
            />
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type='submit'>Record arrival</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Asset team functions (More → Asset Tracking → Team Functions): employee
 * asset list, employee requisition list and New Asset Arrival intake.
 */
export function AssetsTeamTab({ store }: AssetsTeamTabProps) {
  const [assetFilter, setAssetFilter] =
    useState<PeriodStatusFilter>(EMPTY_FILTER)
  const [reqFilter, setReqFilter] = useState<PeriodStatusFilter>(EMPTY_FILTER)
  const [arrivalOpen, setArrivalOpen] = useState(false)

  const assetColumns = useMemo<ColumnDef<TeamEmployeeAsset>[]>(
    () => [
      {
        accessorKey: 'employee',
        header: 'Employee',
        cell: ({ row }) => (
          <EmployeeCell
            name={row.original.employee}
            state={row.original.employeeState}
          />
        ),
      },
      { accessorKey: 'department', header: 'Department' },
      { accessorKey: 'assetName', header: 'Asset' },
      { accessorKey: 'serialNumber', header: 'Serial number' },
      {
        accessorKey: 'assignedOn',
        header: 'Assigned on',
        cell: ({ row }) => formatDate(row.original.assignedOn),
      },
      {
        accessorKey: 'returnBy',
        header: 'Return by',
        cell: ({ row }) => formatDate(row.original.returnBy),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: 'actions',
        header: 'Action',
        cell: ({ row }) =>
          row.original.status === 'Pending Return Confirmation' ? (
            <Button
              className='h-6 rounded-[6px] px-2 text-xs'
              onClick={() => store.confirmReturn(row.original.id)}
            >
              Confirm return
            </Button>
          ) : (
            <span className='text-neutral-1000'>—</span>
          ),
      },
    ],
    [store]
  )

  const requisitionColumns = useMemo<ColumnDef<TeamRequisition>[]>(
    () => [
      { accessorKey: 'number', header: 'Requisition #' },
      {
        accessorKey: 'employee',
        header: 'Employee',
        cell: ({ row }) => (
          <EmployeeCell
            name={row.original.employee}
            state={row.original.employeeState}
          />
        ),
      },
      { accessorKey: 'department', header: 'Department' },
      {
        accessorKey: 'date',
        header: 'Requested on',
        cell: ({ row }) => formatDate(row.original.date),
      },
      { accessorKey: 'asset', header: 'Asset' },
      { accessorKey: 'quantity', header: 'Qty' },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: 'actions',
        header: 'Action',
        cell: ({ row }) => {
          if (row.original.status === 'Pending Approval')
            return (
              <span className='flex gap-1'>
                <Button
                  className='h-6 rounded-[6px] px-2 text-xs'
                  onClick={() =>
                    store.decideRequisition(row.original.id, 'Approved')
                  }
                >
                  Approve
                </Button>
                <Button
                  variant='outline'
                  className='h-6 rounded-[6px] px-2 text-xs'
                  onClick={() =>
                    store.decideRequisition(row.original.id, 'Rejected')
                  }
                >
                  Reject
                </Button>
              </span>
            )
          if (row.original.status === 'Pending for Issuance')
            return (
              <Button
                className='h-6 rounded-[6px] px-2 text-xs'
                onClick={() => store.issueRequisition(row.original.id)}
              >
                Issue asset
              </Button>
            )
          return <span className='text-neutral-1000'>—</span>
        },
      },
    ],
    [store]
  )

  const arrivalColumns = useMemo<ColumnDef<AssetArrival>[]>(
    () => [
      { accessorKey: 'asset', header: 'Asset' },
      { accessorKey: 'quantity', header: 'Qty' },
      { accessorKey: 'vendor', header: 'Vendor' },
      { accessorKey: 'poNumber', header: 'PO number' },
      {
        accessorKey: 'receivedOn',
        header: 'Received on',
        cell: ({ row }) => formatDate(row.original.receivedOn),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: 'actions',
        header: 'Action',
        cell: ({ row }) =>
          row.original.status === 'Awaiting inspection' ? (
            <Button
              className='h-6 rounded-[6px] px-2 text-xs'
              onClick={() => store.addToInventory(row.original.id)}
            >
              Add to inventory
            </Button>
          ) : (
            <span className='text-neutral-1000'>—</span>
          ),
      },
    ],
    [store]
  )

  const filteredAssets = useMemo(
    () =>
      applyFilter(
        store.employeeAssets,
        assetFilter,
        (a) => a.assignedOn,
        (a) => a.status
      ),
    [store.employeeAssets, assetFilter]
  )

  const filteredRequisitions = useMemo(
    () =>
      applyFilter(
        store.requisitions,
        reqFilter,
        (r) => r.date,
        (r) => r.status
      ),
    [store.requisitions, reqFilter]
  )

  const summary = useMemo(
    () => [
      { label: 'Assets with employees', value: store.employeeAssets.length },
      {
        label: 'Requisitions pending',
        value: store.requisitions.filter((r) =>
          r.status.startsWith('Pending')
        ).length,
      },
      {
        label: 'Returns to confirm',
        value: store.employeeAssets.filter(
          (a) => a.status === 'Pending Return Confirmation'
        ).length,
      },
      {
        label: 'Arrivals awaiting inspection',
        value: store.arrivals.filter((a) => a.status === 'Awaiting inspection')
          .length,
      },
    ],
    [store.employeeAssets, store.requisitions, store.arrivals]
  )

  return (
    <div className='w-full'>
      <SummaryCards title='Team Assets Summary' items={summary} />

      <Tabs defaultValue='employee-assets' className='w-full'>
        <TabsList className='mb-3 flex-wrap bg-transparent p-0'>
          <TabsTrigger variant='primary' value='employee-assets'>
            Employee Assets
          </TabsTrigger>
          <TabsTrigger variant='primary' value='requisitions'>
            Employee Requisitions
          </TabsTrigger>
          <TabsTrigger variant='primary' value='arrivals'>
            New Asset Arrival
          </TabsTrigger>
        </TabsList>

        <TabsContent value='employee-assets'>
          <FilterBar
            statuses={TEAM_ASSET_STATUSES}
            value={assetFilter}
            onChange={setAssetFilter}
          />
          <DataTable
            columns={assetColumns}
            data={filteredAssets}
            variant='no-status'
          />
        </TabsContent>

        <TabsContent value='requisitions'>
          <FilterBar
            statuses={REQUISITION_STATUSES}
            value={reqFilter}
            onChange={setReqFilter}
          />
          <DataTable
            columns={requisitionColumns}
            data={filteredRequisitions}
            variant='no-status'
          />
        </TabsContent>

        <TabsContent value='arrivals'>
          <div className='mb-3 flex items-center justify-between'>
            <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
              Recorded arrivals ({store.arrivals.length})
            </h2>
            <Button
              variant='red'
              onClick={() => setArrivalOpen(true)}
              className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
            >
              <Plus size={10} weight='bold' />
              New Asset Arrival
            </Button>
          </div>
          <DataTable
            columns={arrivalColumns}
            data={store.arrivals}
            variant='no-status'
          />
          <p className='text-paragraph-sm text-neutral-1000 mt-2'>
            Statuses: {ARRIVAL_STATUSES.join(' → ')}. Inspected stock becomes
            issuable inventory for employee requisitions.
          </p>
        </TabsContent>
      </Tabs>

      <ArrivalDialog
        open={arrivalOpen}
        onOpenChange={setArrivalOpen}
        onSubmit={store.addArrival}
      />
    </div>
  )
}
