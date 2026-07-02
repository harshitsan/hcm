import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
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
  KT_STATUSES,
  seedAllocations,
  seedKtTasks,
  type AllocationEntry,
  type KtTask,
} from '../data/work'
import { StatusBadge } from './status-badge'
import { FilterBar } from './shared'
import {
  applyFilter,
  EMPTY_FILTER,
  formatDate,
  type PeriodStatusFilter,
} from './utils'

const allocationColumns: ColumnDef<AllocationEntry>[] = [
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) => formatDate(row.original.date),
  },
  { accessorKey: 'projectCode', header: 'Project code' },
  { accessorKey: 'project', header: 'Project' },
  { accessorKey: 'hours', header: 'Allocated hours' },
]

const ktColumns: ColumnDef<KtTask>[] = [
  { accessorKey: 'provider', header: 'Provider' },
  { accessorKey: 'receiver', header: 'Receiver' },
  { accessorKey: 'assigner', header: 'Assigned by' },
  { accessorKey: 'project', header: 'Project' },
  { accessorKey: 'department', header: 'Department' },
  {
    accessorKey: 'startDate',
    header: 'Start date',
    cell: ({ row }) => formatDate(row.original.startDate),
  },
  {
    accessorKey: 'dueDate',
    header: 'Due date',
    cell: ({ row }) => formatDate(row.original.dueDate),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
]

/**
 * Work views: day-wise and project-wise allocation summaries (ESS-37) and
 * knowledge-transfer obligations to be provided / received (ESS-38).
 */
export function WorkTab() {
  const [projectSearch, setProjectSearch] = useState('')
  const [allocFilter, setAllocFilter] =
    useState<PeriodStatusFilter>(EMPTY_FILTER)
  const [ktFilter, setKtFilter] = useState<PeriodStatusFilter>(EMPTY_FILTER)
  const [department, setDepartment] = useState('All')

  const filteredAllocations = useMemo(() => {
    const base = applyFilter(
      seedAllocations,
      { ...allocFilter, status: 'All' },
      (a) => a.date,
      () => 'All'
    )
    return projectSearch
      ? base.filter((a) =>
          `${a.project} ${a.projectCode}`
            .toLowerCase()
            .includes(projectSearch.toLowerCase())
        )
      : base
  }, [allocFilter, projectSearch])

  const projectWise = useMemo(() => {
    const totals = new Map<string, { projectCode: string; project: string; hours: number }>()
    filteredAllocations.forEach((a) => {
      const existing = totals.get(a.projectCode)
      if (existing) existing.hours += a.hours
      else
        totals.set(a.projectCode, {
          projectCode: a.projectCode,
          project: a.project,
          hours: a.hours,
        })
    })
    return [...totals.values()]
  }, [filteredAllocations])

  const filterKt = (direction: KtTask['direction']) => {
    const base = applyFilter(
      seedKtTasks.filter((t) => t.direction === direction),
      ktFilter,
      (t) => t.startDate,
      (t) => t.status
    )
    return department === 'All'
      ? base
      : base.filter((t) => t.department === department)
  }

  return (
    <Tabs defaultValue='allocation' className='w-full'>
      <TabsList className='mb-3 bg-transparent p-0'>
        <TabsTrigger variant='primary' value='allocation'>
          My Project Allocation
        </TabsTrigger>
        <TabsTrigger variant='primary' value='kt-provide'>
          KT To Be Provided
        </TabsTrigger>
        <TabsTrigger variant='primary' value='kt-receive'>
          KT To Be Received
        </TabsTrigger>
      </TabsList>

      <TabsContent value='allocation'>
        <div className='mb-3 flex flex-wrap items-center gap-2'>
          <span className='text-paragraph-sm text-neutral-1000'>Period</span>
          <Input
            type='date'
            aria-label='Allocation from'
            value={allocFilter.from}
            onChange={(e) =>
              setAllocFilter({ ...allocFilter, from: e.target.value })
            }
            className='h-8 w-[150px] bg-white'
          />
          <span className='text-paragraph-sm text-neutral-1000'>to</span>
          <Input
            type='date'
            aria-label='Allocation to'
            value={allocFilter.to}
            onChange={(e) =>
              setAllocFilter({ ...allocFilter, to: e.target.value })
            }
            className='h-8 w-[150px] bg-white'
          />
          <Input
            placeholder='Search project…'
            value={projectSearch}
            onChange={(e) => setProjectSearch(e.target.value)}
            className='h-8 w-[220px] bg-white'
          />
        </div>

        <div className='grid grid-cols-1 gap-4 xl:grid-cols-2'>
          <div>
            <h3 className='text-paragraph-md text-neutral-1600 mb-2 font-medium'>
              Day-wise summary
            </h3>
            <DataTable
              columns={allocationColumns}
              data={filteredAllocations}
              variant='no-status'
            />
          </div>
          <div>
            <h3 className='text-paragraph-md text-neutral-1600 mb-2 font-medium'>
              Project-wise summary
            </h3>
            <div className='space-y-2'>
              {projectWise.map((p) => (
                <div
                  key={p.projectCode}
                  className='flex items-center justify-between rounded-[6px] border border-gray-200 bg-white px-3 py-2'
                >
                  <div>
                    <p className='text-sm font-medium'>{p.project}</p>
                    <p className='text-paragraph-sm text-neutral-1000'>
                      {p.projectCode}
                    </p>
                  </div>
                  <span className='text-lg font-medium'>{p.hours}h</span>
                </div>
              ))}
              {projectWise.length === 0 && (
                <p className='text-paragraph-sm text-neutral-1000'>
                  No allocation in the selected scope.
                </p>
              )}
            </div>
          </div>
        </div>
      </TabsContent>

      {(['kt-provide', 'kt-receive'] as const).map((tab) => (
        <TabsContent key={tab} value={tab}>
          <FilterBar statuses={KT_STATUSES} value={ktFilter} onChange={setKtFilter}>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger className='h-8 w-[190px] bg-white'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='All'>All departments</SelectItem>
                <SelectItem value='Product Engineering'>
                  Product Engineering
                </SelectItem>
                <SelectItem value='Delivery'>Delivery</SelectItem>
              </SelectContent>
            </Select>
          </FilterBar>
          <DataTable
            columns={ktColumns}
            data={filterKt(tab === 'kt-provide' ? 'provide' : 'receive')}
            variant='no-status'
          />
        </TabsContent>
      ))}
    </Tabs>
  )
}
