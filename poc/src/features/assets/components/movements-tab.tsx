import { useMemo, useState } from 'react'
import { Plus } from 'phosphor-react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { MOVEMENT_STATUSES } from '../data/movements'
import { CURRENT_ADMIN, HOME_COMPANY, formatDate, formatInr } from '../data/org'
import { type AssetConfigStore } from '../hooks/use-asset-config'
import { type AssetsStore } from '../hooks/use-assets'
import { type MovementsStore } from '../hooks/use-movements'
import { MovementStatusBadge } from './badges'
import { ArrivalFormDialog, OutboundFormDialog } from './movement-form-dialogs'

interface MovementsTabProps {
  movements: MovementsStore
  assetsStore: AssetsStore
  config: AssetConfigStore
}

/**
 * Inbound + outbound movements: new asset arrivals with procurement details
 * and approval into inventory (ASM-32/33), and outbound records gated by a
 * security pass and approval (ASM-34/35). Both lists share status, asset
 * category and From/To period filters — arrivals filter on the procured
 * date (NAAL-04) and outbound records on the gate-pass date (OAL-03).
 */
export function MovementsTab({ movements, assetsStore, config }: MovementsTabProps) {
  const [tab, setTab] = useState('arrivals')
  const [statusFilter, setStatusFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [fromFilter, setFromFilter] = useState('')
  const [toFilter, setToFilter] = useState('')
  const [pendingWithMe, setPendingWithMe] = useState(false)
  const [arrivalFormOpen, setArrivalFormOpen] = useState(false)
  const [outboundFormOpen, setOutboundFormOpen] = useState(false)

  const arrivalApprover = config.approverFor('Arrival')
  const outboundApprover = config.approverFor('Outbound')

  const filteredArrivals = useMemo(
    () =>
      movements.arrivals.filter((a) => {
        if (statusFilter !== 'All' && a.status !== statusFilter) return false
        if (categoryFilter !== 'All' && a.category !== categoryFilter) return false
        if (fromFilter && a.procuredDate < fromFilter) return false
        if (toFilter && a.procuredDate > toFilter) return false
        if (pendingWithMe && !(a.status === 'Pending Approval' && arrivalApprover === CURRENT_ADMIN))
          return false
        return true
      }),
    [movements.arrivals, statusFilter, categoryFilter, fromFilter, toFilter, pendingWithMe, arrivalApprover]
  )

  const filteredOutbound = useMemo(
    () =>
      movements.outbound.filter((o) => {
        if (statusFilter !== 'All' && o.status !== statusFilter) return false
        if (categoryFilter !== 'All' && o.category !== categoryFilter) return false
        if (fromFilter && o.passDate < fromFilter) return false
        if (toFilter && o.passDate > toFilter) return false
        if (pendingWithMe && !(o.status === 'Pending Approval' && outboundApprover === CURRENT_ADMIN))
          return false
        return true
      }),
    [movements.outbound, statusFilter, categoryFilter, fromFilter, toFilter, pendingWithMe, outboundApprover]
  )

  const handleArrivalDecision = (id: string, approved: boolean) => {
    const record = movements.decideArrival(id, approved)
    if (record) assetsStore.admitArrival(record, HOME_COMPANY)
  }

  return (
    <div className='w-full'>
      <div className='border-grey-200 mb-3 flex flex-wrap items-end gap-3 rounded-[6px] border bg-white px-3 py-2.5'>
        <div className='flex flex-col gap-1'>
          <Label className='text-paragraph-sm'>Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className='h-7! w-[180px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='All'>All statuses</SelectItem>
              {MOVEMENT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='flex flex-col gap-1'>
          <Label className='text-paragraph-sm'>Asset category</Label>
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
          <Label htmlFor='mov-from' className='text-paragraph-sm'>
            Period from
          </Label>
          <Input
            id='mov-from'
            type='date'
            value={fromFilter}
            onChange={(e) => setFromFilter(e.target.value)}
            className='h-7 w-[145px]'
          />
        </div>
        <div className='flex flex-col gap-1'>
          <Label htmlFor='mov-to' className='text-paragraph-sm'>
            Period to
          </Label>
          <Input
            id='mov-to'
            type='date'
            value={toFilter}
            onChange={(e) => setToFilter(e.target.value)}
            className='h-7 w-[145px]'
          />
        </div>
        <div className='mb-1 flex items-center gap-2'>
          <Switch id='mov-pwm' checked={pendingWithMe} onCheckedChange={setPendingWithMe} />
          <Label htmlFor='mov-pwm' className='text-paragraph-sm'>
            Pending with me
          </Label>
        </div>
        <div className='ms-auto'>
          <Button
            variant='outline'
            className='h-7 rounded-[6px] px-2.5'
            onClick={() => {
              setStatusFilter('All')
              setCategoryFilter('All')
              setFromFilter('')
              setToFilter('')
              setPendingWithMe(false)
            }}
          >
            Reset
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className='w-full'>
        <div className='mb-1 flex items-center justify-between'>
          <TabsList className='bg-transparent p-0'>
            <TabsTrigger variant='ghost' value='arrivals'>
              New Asset Arrivals ({filteredArrivals.length})
            </TabsTrigger>
            <TabsTrigger variant='ghost' value='outbound'>
              Outbound Assets ({filteredOutbound.length})
            </TabsTrigger>
          </TabsList>
          <Button
            variant='red'
            onClick={() => (tab === 'arrivals' ? setArrivalFormOpen(true) : setOutboundFormOpen(true))}
            className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
          >
            <Plus size={10} weight='bold' />
            {tab === 'arrivals' ? 'Add Asset Inward' : 'New Outbound Record'}
          </Button>
        </div>

        <TabsContent value='arrivals'>
          <div className='border-grey-200 overflow-hidden rounded-[6px] border bg-white'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset / category</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Procured / invoice</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Total value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Decision</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredArrivals.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div className='flex flex-col'>
                        <span className='text-neutral-1600 text-sm font-medium'>{a.name}</span>
                        <span className='text-paragraph-sm text-neutral-1000'>{a.category}</span>
                      </div>
                    </TableCell>
                    <TableCell className='text-sm'>{a.vendor}</TableCell>
                    <TableCell>
                      <div className='flex flex-col'>
                        <span className='text-sm'>{formatDate(a.procuredDate)}</span>
                        <span className='text-paragraph-sm text-neutral-1000'>{a.invoiceNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell className='text-sm'>{a.approvedQuantity}</TableCell>
                    <TableCell className='text-sm'>{formatInr(a.totalValue)}</TableCell>
                    <TableCell>
                      <div className='flex flex-col gap-0.5'>
                        <MovementStatusBadge status={a.status} />
                        {a.decidedBy && (
                          <span className='text-paragraph-sm text-neutral-1000'>
                            by {a.decidedBy} · {formatDate(a.decidedOn)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {a.status === 'Pending Approval' ? (
                        <div className='flex gap-1.5'>
                          <Button
                            className='h-7 rounded-[6px] px-2'
                            onClick={() => handleArrivalDecision(a.id, true)}
                          >
                            Approve
                          </Button>
                          <Button
                            variant='outline'
                            className='h-7 rounded-[6px] px-2'
                            onClick={() => handleArrivalDecision(a.id, false)}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className='text-paragraph-sm text-neutral-1000'>
                          {a.status === 'Approved' ? 'Units admitted as Available' : 'No assets admitted'}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value='outbound'>
          <div className='border-grey-200 overflow-hidden rounded-[6px] border bg-white'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset / category</TableHead>
                  <TableHead>Vendor / destination</TableHead>
                  <TableHead>Security pass</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Decision</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOutbound.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <div className='flex flex-col'>
                        <span className='text-neutral-1600 text-sm font-medium'>{o.name}</span>
                        <span className='text-paragraph-sm text-neutral-1000'>{o.category}</span>
                      </div>
                    </TableCell>
                    <TableCell className='text-sm'>{o.vendor}</TableCell>
                    <TableCell>
                      <div className='flex flex-col'>
                        <span className='text-sm font-medium'>{o.passNumber}</span>
                        <span className='text-paragraph-sm text-neutral-1000'>
                          {formatDate(o.passDate)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className='text-paragraph-sm max-w-[220px]'>{o.reason}</TableCell>
                    <TableCell>
                      <div className='flex flex-col gap-0.5'>
                        <MovementStatusBadge status={o.status} />
                        {o.decidedBy && (
                          <span className='text-paragraph-sm text-neutral-1000'>
                            by {o.decidedBy} · {formatDate(o.decidedOn)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {o.status === 'Pending Approval' ? (
                        <div className='flex gap-1.5'>
                          <Button
                            className='h-7 rounded-[6px] px-2'
                            onClick={() => movements.decideOutbound(o.id, true)}
                          >
                            Approve
                          </Button>
                          <Button
                            variant='outline'
                            className='h-7 rounded-[6px] px-2'
                            onClick={() => movements.decideOutbound(o.id, false)}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className='text-paragraph-sm text-neutral-1000'>
                          {o.status === 'Approved' ? 'Pass valid for removal' : 'Removal not authorised'}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <ArrivalFormDialog
        open={arrivalFormOpen}
        onOpenChange={setArrivalFormOpen}
        categories={config.categories}
        onSubmit={movements.addArrival}
      />
      <OutboundFormDialog
        open={outboundFormOpen}
        onOpenChange={setOutboundFormOpen}
        categories={config.categories}
        onSubmit={movements.addOutbound}
      />
    </div>
  )
}
