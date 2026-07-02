import { useEffect, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'phosphor-react'
import { useRole } from '@/context/role-context'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataTable } from '@/components/common/data-table/table'
import {
  ASSET_CATALOG,
  REQUISITION_STATUSES,
  type AssetRequisition,
  type AssignedAsset,
} from '../data/assets'
import { type AssetsStore } from '../hooks/use-assets'
import { StatusBadge } from './status-badge'
import { FilterBar } from './shared'
import {
  applyFilter,
  EMPTY_FILTER,
  formatDate,
  type PeriodStatusFilter,
} from './utils'

const requisitionSchema = z.object({
  asset: z.string().min(1, 'Select an asset'),
  quantity: z.number().min(1, 'Quantity must be at least 1').max(5, 'Max 5 units'),
  returnBefore: z.string(),
})

type RequisitionValues = z.infer<typeof requisitionSchema>

interface AssetsTabProps {
  store: AssetsStore
}

/** Asset tracking: requisitions (ESS-31) and assigned-asset custody (ESS-32). */
export function AssetsTab({ store }: AssetsTabProps) {
  const { hasRole } = useRole()
  const isEmployee = hasRole('Employee (User)')

  const [filter, setFilter] = useState<PeriodStatusFilter>(EMPTY_FILTER)
  const [overlayOpen, setOverlayOpen] = useState(false)

  const form = useForm<RequisitionValues>({
    resolver: zodResolver(requisitionSchema),
    defaultValues: { asset: ASSET_CATALOG[0], quantity: 1, returnBefore: '' },
  })

  useEffect(() => {
    if (overlayOpen) form.reset()
  }, [overlayOpen, form])

  const requisitionColumns = useMemo<ColumnDef<AssetRequisition>[]>(
    () => [
      { accessorKey: 'number', header: 'Requisition #' },
      {
        accessorKey: 'date',
        header: 'Date',
        cell: ({ row }) => formatDate(row.original.date),
      },
      { accessorKey: 'asset', header: 'Requested asset' },
      { accessorKey: 'quantity', header: 'Qty' },
      {
        accessorKey: 'returnBefore',
        header: 'To be returned before',
        cell: ({ row }) => formatDate(row.original.returnBefore),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: 'task',
        header: 'Task',
        cell: ({ row }) => {
          const r = row.original
          if (!isEmployee) return <span className='text-neutral-1000'>—</span>
          if (r.task) {
            return (
              <Button
                className='h-6 rounded-[6px] px-2 text-xs'
                onClick={() => store.returnRequisition(r.id)}
              >
                {r.task}
              </Button>
            )
          }
          if (r.status === 'Pending Approval') {
            return (
              <Button
                variant='outline'
                className='h-6 rounded-[6px] px-2 text-xs'
                onClick={() => store.withdrawRequisition(r.id)}
              >
                Withdraw
              </Button>
            )
          }
          return <span className='text-neutral-1000'>—</span>
        },
      },
    ],
    [store, isEmployee]
  )

  const assignedColumns = useMemo<ColumnDef<AssignedAsset>[]>(
    () => [
      { accessorKey: 'requisitionNumber', header: 'Requisition #' },
      { accessorKey: 'assetName', header: 'Asset name' },
      { accessorKey: 'serialNumber', header: 'Serial number' },
      {
        accessorKey: 'assignedOn',
        header: 'Assigned on',
        cell: ({ row }) => formatDate(row.original.assignedOn),
      },
      {
        accessorKey: 'returnBy',
        header: 'To be returned on',
        cell: ({ row }) => formatDate(row.original.returnBy),
      },
      {
        accessorKey: 'returnedOn',
        header: 'Returned on',
        cell: ({ row }) => formatDate(row.original.returnedOn),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: 'task',
        header: 'Task',
        cell: ({ row }) => {
          const asset = row.original
          if (!isEmployee || !asset.task)
            return <span className='text-neutral-1000'>—</span>
          return (
            <Button
              className='h-6 rounded-[6px] px-2 text-xs'
              onClick={() =>
                asset.status === 'Pending for Receipt Acknowledgement'
                  ? store.acknowledgeReceipt(asset.id)
                  : store.confirmReturn(asset.id)
              }
            >
              {asset.task}
            </Button>
          )
        },
      },
    ],
    [store, isEmployee]
  )

  const filteredRequisitions = useMemo(
    () =>
      applyFilter(store.requisitions, filter, (r) => r.date, (r) => r.status),
    [store.requisitions, filter]
  )

  return (
    <Tabs defaultValue='requisitions' className='w-full'>
      <TabsList className='mb-3 bg-transparent p-0'>
        <TabsTrigger variant='primary' value='requisitions'>
          My Asset Requisitions
        </TabsTrigger>
        <TabsTrigger variant='primary' value='assigned'>
          My Asset List
        </TabsTrigger>
      </TabsList>

      <TabsContent value='requisitions'>
        <FilterBar
          statuses={REQUISITION_STATUSES}
          value={filter}
          onChange={setFilter}
        >
          {isEmployee && (
            <span className='ml-auto'>
              <Button
                variant='red'
                onClick={() => setOverlayOpen(true)}
                className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
              >
                <Plus size={10} weight='bold' />
                New Requisition
              </Button>
            </span>
          )}
        </FilterBar>
        <DataTable
          columns={requisitionColumns}
          data={filteredRequisitions}
          variant='no-status'
        />
      </TabsContent>

      <TabsContent value='assigned'>
        <DataTable
          columns={assignedColumns}
          data={store.assignedAssets}
          variant='no-status'
        />
      </TabsContent>

      <Dialog open={overlayOpen} onOpenChange={setOverlayOpen}>
        <DialogContent className='sm:max-w-[420px]'>
          <DialogHeader>
            <DialogTitle>New asset requisition</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) => {
                store.addRequisition({
                  asset: values.asset,
                  quantity: values.quantity,
                  returnBefore: values.returnBefore || null,
                })
                setOverlayOpen(false)
              })}
              className='space-y-3'
            >
              <FormField
                control={form.control}
                name='asset'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requested asset</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ASSET_CATALOG.map((a) => (
                          <SelectItem key={a} value={a}>
                            {a}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='quantity'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min={1}
                        max={5}
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='returnBefore'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To be returned before (optional)</FormLabel>
                    <FormControl>
                      <Input type='date' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setOverlayOpen(false)}
                >
                  Cancel
                </Button>
                <Button type='submit'>Raise requisition</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Tabs>
  )
}
