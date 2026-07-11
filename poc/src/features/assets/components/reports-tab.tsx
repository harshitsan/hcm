import { useMemo, useState } from 'react'
import { DownloadSimple } from 'phosphor-react'
import { toast } from 'sonner'
import { useRole } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { type Acknowledgement } from '../data/acknowledgements'
import {
  COMPANIES,
  CURRENT_ADMIN,
  DEPARTMENTS,
  EMPLOYEES,
  PORTFOLIO_NAME,
  employeeName,
  formatDate,
  formatInr,
  todayIso,
  visibleCompanies,
} from '../data/org'
import { type AssetConfigStore } from '../hooks/use-asset-config'
import { type AssetsStore } from '../hooks/use-assets'
import { type RequisitionsStore } from '../hooks/use-requisitions'
import { daysOverdue } from './asset-columns'
import { AckDialog } from './ack-dialog'
import { AssetStateBadge } from './badges'

const REPORTS = [
  { id: 'assignment', label: 'Asset assignment' },
  { id: 'inventory', label: 'Inventory by category & state' },
  { id: 'pending-acks', label: 'Pending acknowledgements' },
  { id: 'overdue', label: 'Overdue returns' },
  { id: 'employee-summary', label: 'Employee asset summary & valuation' },
] as const

type ReportId = (typeof REPORTS)[number]['id']

interface ReportsTabProps {
  assetsStore: AssetsStore
  reqStore: RequisitionsStore
  config: AssetConfigStore
}

/**
 * Reporting surface (ASM-10, ASM-16, ASM-26, ASM-38, ASM-39): assignment,
 * inventory, pending acknowledgements (with on-behalf capture, ASM-14),
 * overdue returns, and the per-employee holding/valuation summary, with a
 * From/To period (issue-date) range filter across reports (EAL-03). Oversight
 * roles read consolidated data with company/group dimensions; export applies
 * the current scope.
 */
export function ReportsTab({ assetsStore, reqStore, config }: ReportsTabProps) {
  const { role } = useRole()
  const isCompanyAdmin = role === 'Company Admin'
  const scope = visibleCompanies(role)
  const multiCompany = scope.length > 1

  const [report, setReport] = useState<ReportId>('assignment')
  const [companyFilter, setCompanyFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [fromFilter, setFromFilter] = useState('')
  const [toFilter, setToFilter] = useState('')
  const [deptFilter, setDeptFilter] = useState('All')
  const [activeOnly, setActiveOnly] = useState(true)
  const [onBehalfTarget, setOnBehalfTarget] = useState<Acknowledgement | null>(null)

  const today = todayIso()

  const scopedAssets = useMemo(
    () =>
      assetsStore.assets.filter((a) => {
        if (!scope.includes(a.company)) return false
        if (companyFilter !== 'All' && a.company !== companyFilter) return false
        if (categoryFilter !== 'All' && a.category !== categoryFilter) return false
        // Period date-range filter (EAL-03): keep assets whose issue date
        // falls inside the chosen From/To window.
        if ((fromFilter || toFilter) && !a.issueDate) return false
        if (fromFilter && a.issueDate && a.issueDate < fromFilter) return false
        if (toFilter && a.issueDate && a.issueDate > toFilter) return false
        return true
      }),
    [assetsStore.assets, scope, companyFilter, categoryFilter, fromFilter, toFilter]
  )

  const scopedEmployees = useMemo(
    () =>
      EMPLOYEES.filter((e) => {
        if (!scope.includes(e.company)) return false
        if (companyFilter !== 'All' && e.company !== companyFilter) return false
        if (deptFilter !== 'All' && e.department !== deptFilter) return false
        if (activeOnly && !e.active) return false
        return true
      }),
    [scope, companyFilter, deptFilter, activeOnly]
  )

  const pendingAcks = useMemo(
    () => assetsStore.acknowledgements.filter((k) => k.status === 'Pending'),
    [assetsStore.acknowledgements]
  )

  const overdueAssets = useMemo(
    () => scopedAssets.filter((a) => daysOverdue(a, today) > 0),
    [scopedAssets, today]
  )

  const categoryRollup = useMemo(() => {
    const map = new Map<string, { count: number; value: number }>()
    for (const a of scopedAssets) {
      const entry = map.get(a.category) ?? { count: 0, value: 0 }
      entry.count += 1
      entry.value += a.value
      map.set(a.category, entry)
    }
    return [...map.entries()].sort((x, y) => y[1].count - x[1].count)
  }, [scopedAssets])

  const heldValue = (employeeId: string) =>
    scopedAssets
      .filter((a) => a.holderId === employeeId)
      .reduce((sum, a) => sum + a.value, 0)

  const totalHeldValue = scopedEmployees.reduce((sum, e) => sum + heldValue(e.id), 0)

  return (
    <div className='w-full space-y-3'>
      <div className='border-gray-200 flex flex-wrap items-end gap-3 rounded-[6px] border bg-white px-3 py-2.5'>
        <div className='flex flex-col gap-1'>
          <Label className='text-paragraph-sm'>Report</Label>
          <Select value={report} onValueChange={(v) => setReport(v as ReportId)}>
            <SelectTrigger className='h-7! w-[250px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REPORTS.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {multiCompany && (
          <div className='flex flex-col gap-1'>
            <Label className='text-paragraph-sm'>
              {role === 'Portfolio Admin' ? `Company (${PORTFOLIO_NAME})` : 'Company'}
            </Label>
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger className='h-7! w-[210px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='All'>All in my scope</SelectItem>
                {COMPANIES.filter((c) => scope.includes(c.name)).map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.name} ({c.group})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className='flex flex-col gap-1'>
          <Label className='text-paragraph-sm'>Category</Label>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className='h-7! w-[170px]'>
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
          <Label htmlFor='rep-from' className='text-paragraph-sm'>
            Period from (issue date)
          </Label>
          <Input
            id='rep-from'
            type='date'
            value={fromFilter}
            onChange={(e) => setFromFilter(e.target.value)}
            className='h-7 w-[145px]'
          />
        </div>
        <div className='flex flex-col gap-1'>
          <Label htmlFor='rep-to' className='text-paragraph-sm'>
            Period to
          </Label>
          <Input
            id='rep-to'
            type='date'
            value={toFilter}
            onChange={(e) => setToFilter(e.target.value)}
            className='h-7 w-[145px]'
          />
        </div>
        {report === 'employee-summary' && (
          <>
            <div className='flex flex-col gap-1'>
              <Label className='text-paragraph-sm'>Department</Label>
              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger className='h-7! w-[160px]'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='All'>All departments</SelectItem>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='mb-1 flex items-center gap-2'>
              <Switch id='rep-active' checked={activeOnly} onCheckedChange={setActiveOnly} />
              <Label htmlFor='rep-active' className='text-paragraph-sm'>
                Active employees only
              </Label>
            </div>
          </>
        )}
        <div className='ms-auto flex items-center gap-2'>
          <Button
            variant='outline'
            className='h-7 rounded-[6px] px-2.5'
            onClick={() => {
              setCompanyFilter('All')
              setCategoryFilter('All')
              setFromFilter('')
              setToFilter('')
              setDeptFilter('All')
              setActiveOnly(true)
            }}
          >
            Reset
          </Button>
          <Button
            variant='outline'
            className='h-7 gap-1 rounded-[6px] px-2.5'
            onClick={() =>
              toast.success('Report exported with the applied filters (demo download)')
            }
          >
            <DownloadSimple size={14} weight='bold' />
            Export
          </Button>
        </div>
      </div>

      <div className='border-gray-200 overflow-hidden rounded-[6px] border bg-white'>
        {report === 'assignment' && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Assigned to</TableHead>
                <TableHead>Issue date</TableHead>
                <TableHead>State</TableHead>
                {multiCompany && <TableHead>Company</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {scopedAssets
                .filter((a) => a.holderId)
                .map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className='text-sm font-medium'>
                      {a.assetTag} · {a.name}
                    </TableCell>
                    <TableCell className='text-sm'>{a.category}</TableCell>
                    <TableCell className='text-sm'>{employeeName(a.holderId)}</TableCell>
                    <TableCell className='text-sm'>{formatDate(a.issueDate)}</TableCell>
                    <TableCell>
                      <AssetStateBadge state={a.state} />
                    </TableCell>
                    {multiCompany && <TableCell className='text-sm'>{a.company}</TableCell>}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}

        {report === 'inventory' && (
          <div>
            <div className='border-gray-200 flex flex-wrap gap-2 border-b p-3'>
              {categoryRollup.map(([category, agg]) => (
                <Badge key={category} variant='open'>
                  {category}: {agg.count} · {formatInr(agg.value)}
                </Badge>
              ))}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Value</TableHead>
                  {multiCompany && <TableHead>Company / group</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {scopedAssets.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className='text-sm font-medium'>
                      {a.assetTag} · {a.name}
                    </TableCell>
                    <TableCell className='text-sm'>{a.category}</TableCell>
                    <TableCell>
                      <AssetStateBadge state={a.state} />
                    </TableCell>
                    <TableCell className='text-sm'>{formatInr(a.value)}</TableCell>
                    {multiCompany && (
                      <TableCell className='text-sm'>
                        {a.company} · {COMPANIES.find((c) => c.name === a.company)?.group}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {report === 'pending-acks' && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Responsible employee</TableHead>
                <TableHead>Raised</TableHead>
                {isCompanyAdmin && <TableHead>Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingAcks.map((k) => (
                <TableRow key={k.id}>
                  <TableCell className='text-sm font-medium'>{k.assetLabel}</TableCell>
                  <TableCell>
                    <Badge variant='pending'>Awaiting {k.type.toLowerCase()}</Badge>
                  </TableCell>
                  <TableCell className='text-sm'>{k.employeeName}</TableCell>
                  <TableCell className='text-sm'>{formatDate(k.raisedOn)}</TableCell>
                  {isCompanyAdmin && (
                    <TableCell>
                      <Button
                        variant='outline'
                        className='h-7 rounded-[6px] px-2.5'
                        onClick={() => setOnBehalfTarget(k)}
                      >
                        Record on behalf
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {report === 'overdue' && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Holder</TableHead>
                <TableHead>Expected return</TableHead>
                <TableHead>Days overdue</TableHead>
                {multiCompany && <TableHead>Company</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {overdueAssets.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className='text-sm font-medium'>
                    {a.assetTag} · {a.name}
                  </TableCell>
                  <TableCell className='text-sm'>{employeeName(a.holderId)}</TableCell>
                  <TableCell className='text-sm'>{formatDate(a.expectedReturnDate)}</TableCell>
                  <TableCell>
                    <Badge variant='dropped'>{daysOverdue(a, today)} day(s)</Badge>
                  </TableCell>
                  {multiCompany && <TableCell className='text-sm'>{a.company}</TableCell>}
                </TableRow>
              ))}
              {overdueAssets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={multiCompany ? 5 : 4} className='text-paragraph-sm text-neutral-1000 py-6 text-center'>
                    No overdue returns in scope
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        {report === 'employee-summary' && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department / designation</TableHead>
                <TableHead>DOJ</TableHead>
                <TableHead>Pending ARF</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Returned</TableHead>
                <TableHead>Total asset value held</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scopedEmployees.map((e) => {
                const pendingArf = reqStore.requisitions.filter(
                  (r) =>
                    r.requesterId === e.id &&
                    (r.status === 'Pending Approval' ||
                      r.status === 'Pending for Issuance' ||
                      r.status === 'Pending for Partial Issuance')
                ).length
                const issued = scopedAssets.filter((a) => a.holderId === e.id).length
                const returned = scopedAssets.filter((a) =>
                  a.history.some((hEntry) => hEntry.newState === 'Returned' && hEntry.employee === e.name)
                ).length
                return (
                  <TableRow key={e.id}>
                    <TableCell>
                      <div className='flex flex-col'>
                        <span className='text-sm font-medium'>{e.name}</span>
                        <span className='text-paragraph-sm text-neutral-1000'>
                          {e.code}
                          {e.active ? '' : ' · inactive'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className='text-sm'>
                      {e.department} · {e.designation}
                    </TableCell>
                    <TableCell className='text-sm'>{formatDate(e.dateOfJoining)}</TableCell>
                    <TableCell className='text-sm'>{pendingArf}</TableCell>
                    <TableCell className='text-sm'>{issued}</TableCell>
                    <TableCell className='text-sm'>{returned}</TableCell>
                    <TableCell className='text-sm font-medium'>
                      {formatInr(heldValue(e.id))}
                    </TableCell>
                  </TableRow>
                )
              })}
              <TableRow>
                <TableCell colSpan={6} className='text-sm font-medium'>
                  Combined value of all assigned assets in scope
                </TableCell>
                <TableCell className='text-sm font-semibold'>
                  {formatInr(totalHeldValue)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </div>

      <AckDialog
        open={onBehalfTarget !== null}
        onOpenChange={(open) => {
          if (!open) setOnBehalfTarget(null)
        }}
        ack={onBehalfTarget}
        questionnaireVersions={config.questionnaireVersions}
        recordedBy={CURRENT_ADMIN}
        onBehalf
        onSubmit={(ackId, responses) =>
          assetsStore.completeAcknowledgement(ackId, responses, CURRENT_ADMIN, true)
        }
      />
    </div>
  )
}
