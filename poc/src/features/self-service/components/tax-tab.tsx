import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowsClockwise, Plus } from 'phosphor-react'
import { toast } from 'sonner'
import { useRole } from '@/context/role-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataTable } from '@/components/common/data-table/table'
import {
  DEDUCTION_CATEGORIES,
  FINANCIAL_YEARS,
  SALARY_MONTHS,
  type FinancialYear,
  type LtaClaim,
  type TaxDeduction,
  type TaxExemption,
} from '../data/tax'
import { type TaxStore } from '../hooks/use-tax'
import { DeductionOverlay, LtaOverlay } from './tax-overlays'
import { formatDate, formatInr } from './utils'

interface TaxTabProps {
  store: TaxStore
}

/**
 * Tax planning: deduction declarations (ESS-33), exemptions (ESS-34), LTA
 * claims (ESS-35) and the month-by-month salary/TDS table (ESS-36).
 */
export function TaxTab({ store }: TaxTabProps) {
  const { hasRole } = useRole()
  const isEmployee = hasRole('Employee (User)')

  const [fy, setFy] = useState<FinancialYear>('2026-27')
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [deductionOpen, setDeductionOpen] = useState(false)
  const [ltaOpen, setLtaOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const deductionColumns = useMemo<ColumnDef<TaxDeduction>[]>(
    () => [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'category', header: 'Category' },
      { accessorKey: 'providerName', header: 'Insurer / bank' },
      { accessorKey: 'referenceNumber', header: 'Policy / loan #' },
      {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ row }) => formatInr(row.original.amount),
      },
      {
        accessorKey: 'paymentDate',
        header: 'Payment date',
        cell: ({ row }) => formatDate(row.original.paymentDate),
      },
      {
        accessorKey: 'actualPaymentDate',
        header: 'Actual payment date',
        cell: ({ row }) => formatDate(row.original.actualPaymentDate),
      },
    ],
    []
  )

  const exemptionColumns = useMemo<ColumnDef<TaxExemption>[]>(
    () => [
      { accessorKey: 'type', header: 'Exemption type' },
      {
        accessorKey: 'applicableFrom',
        header: 'Applicable from',
        cell: ({ row }) => formatDate(row.original.applicableFrom),
      },
      {
        accessorKey: 'applicableTo',
        header: 'Applicable to',
        cell: ({ row }) => formatDate(row.original.applicableTo),
      },
      {
        accessorKey: 'monthlyAmount',
        header: 'Monthly amount',
        cell: ({ row }) => formatInr(row.original.monthlyAmount),
      },
    ],
    []
  )

  const ltaColumns = useMemo<ColumnDef<LtaClaim>[]>(
    () => [
      { accessorKey: 'financialYear', header: 'Financial year' },
      { accessorKey: 'travellerName', header: 'Traveller' },
      { accessorKey: 'relationship', header: 'Relationship' },
      {
        accessorKey: 'departureDate',
        header: 'Departure',
        cell: ({ row }) => formatDate(row.original.departureDate),
      },
      {
        accessorKey: 'arrivalDate',
        header: 'Arrival',
        cell: ({ row }) => formatDate(row.original.arrivalDate),
      },
      { accessorKey: 'modeOfTravel', header: 'Mode' },
      {
        accessorKey: 'totalAmount',
        header: 'Total amount',
        cell: ({ row }) => formatInr(row.original.totalAmount),
      },
      {
        id: 'claimPeriod',
        header: 'Claim period',
        cell: ({ row }) =>
          `${formatDate(row.original.claimFrom)} – ${formatDate(row.original.claimTo)}`,
      },
      { accessorKey: 'claimsAvailed', header: 'Claims availed' },
    ],
    []
  )

  const filteredDeductions = useMemo(
    () =>
      store.deductions.filter((d) => {
        if (d.financialYear !== fy) return false
        if (category !== 'All' && d.category !== category) return false
        if (
          search &&
          !`${d.name} ${d.providerName} ${d.referenceNumber}`
            .toLowerCase()
            .includes(search.toLowerCase())
        )
          return false
        return true
      }),
    [store.deductions, fy, category, search]
  )

  const filteredExemptions = useMemo(
    () => store.exemptions.filter((e) => e.financialYear === fy),
    [store.exemptions, fy]
  )
  const filteredLta = useMemo(
    () => store.ltaClaims.filter((c) => c.financialYear === fy),
    [store.ltaClaims, fy]
  )

  return (
    <div className='w-full'>
      <div className='mb-3 flex items-center gap-2'>
        <span className='text-paragraph-sm text-neutral-1000'>
          Financial year
        </span>
        <Select value={fy} onValueChange={(v) => setFy(v as FinancialYear)}>
          <SelectTrigger className='h-8 w-[140px] bg-white'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FINANCIAL_YEARS.map((y) => (
              <SelectItem key={y} value={y}>
                FY {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue='deductions' className='w-full'>
        <TabsList className='mb-3 bg-transparent p-0'>
          <TabsTrigger variant='primary' value='deductions'>
            My Deductions
          </TabsTrigger>
          <TabsTrigger variant='primary' value='exemptions'>
            My Exemptions
          </TabsTrigger>
          <TabsTrigger variant='primary' value='lta'>
            My LTA Reimbursement
          </TabsTrigger>
          <TabsTrigger variant='primary' value='salary'>
            My Salary Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value='deductions'>
          <div className='mb-3 flex flex-wrap items-center gap-2'>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className='h-8 w-[230px] bg-white'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='All'>All categories</SelectItem>
                {DEDUCTION_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder='Search deductions…'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='h-8 w-[220px] bg-white'
            />
            {isEmployee && (
              <span className='ml-auto'>
                <Button
                  variant='red'
                  onClick={() => setDeductionOpen(true)}
                  className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
                >
                  <Plus size={10} weight='bold' />
                  Declare Deduction
                </Button>
              </span>
            )}
          </div>
          <DataTable
            columns={deductionColumns}
            data={filteredDeductions}
            variant='no-status'
          />
        </TabsContent>

        <TabsContent value='exemptions'>
          <div className='mb-3 flex items-center justify-between'>
            <span className='text-paragraph-sm text-neutral-1000'>
              Exemptions applied to your salary for FY {fy}
            </span>
            <Button
              variant='outline'
              className='h-7 gap-1 rounded-[6px] px-2'
              onClick={() => {
                setRefreshKey((k) => k + 1)
                toast.success('Exemptions reloaded with the latest saved values')
              }}
            >
              <ArrowsClockwise size={13} weight='bold' />
              Refresh
            </Button>
          </div>
          <DataTable
            key={refreshKey}
            columns={exemptionColumns}
            data={filteredExemptions}
            variant='no-status'
          />
        </TabsContent>

        <TabsContent value='lta'>
          <div className='mb-3 flex items-center justify-end'>
            {isEmployee && (
              <Button
                variant='red'
                onClick={() => setLtaOpen(true)}
                className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
              >
                <Plus size={10} weight='bold' />
                New Claim
              </Button>
            )}
          </div>
          <DataTable columns={ltaColumns} data={filteredLta} variant='no-status' />
        </TabsContent>

        <TabsContent value='salary'>
          <div className='overflow-x-auto rounded-md border bg-white'>
            <Table>
              <TableHeader>
                <TableRow className='bg-gray-50'>
                  <TableHead className='min-w-[220px]'>Component</TableHead>
                  {SALARY_MONTHS.map((month) => (
                    <TableHead key={month} className='text-right'>
                      {month}
                    </TableHead>
                  ))}
                  <TableHead className='text-right font-semibold'>
                    Total
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {store.salaryRows.map((row) => (
                  <TableRow
                    key={row.component}
                    className={
                      row.kind === 'summary' || row.kind === 'tds'
                        ? 'bg-blue-150/40 font-medium'
                        : undefined
                    }
                  >
                    <TableCell>{row.component}</TableCell>
                    {row.amounts.map((amount, idx) => (
                      <TableCell
                        key={`${row.component}-${SALARY_MONTHS[idx]}`}
                        className='text-right'
                      >
                        {amount.toLocaleString('en-IN')}
                      </TableCell>
                    ))}
                    <TableCell className='text-right font-medium'>
                      {row.amounts
                        .reduce((a, b) => a + b, 0)
                        .toLocaleString('en-IN')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className='text-paragraph-sm text-neutral-1000 mt-2'>
            Amounts in ₹ for FY {fy}. The last row shows the actual TDS deducted
            as per your payslips.
          </p>
        </TabsContent>
      </Tabs>

      <DeductionOverlay
        open={deductionOpen}
        onOpenChange={setDeductionOpen}
        financialYear={fy}
        onSubmit={store.addDeduction}
      />
      <LtaOverlay
        open={ltaOpen}
        onOpenChange={setLtaOpen}
        financialYear={fy}
        onSubmit={store.addLtaClaim}
      />
    </div>
  )
}
