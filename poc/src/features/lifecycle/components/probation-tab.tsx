import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DataTable } from '@/components/common/data-table/table'
import { useRole } from '@/context/role-context'
import { type ProbationDecisionTable } from '../data/config'
import {
  type PeerReview,
  type PeriodicReview,
  type ProbationCase,
} from '../data/probation'
import { DEPARTMENTS, PERSONAS } from '../data/shared'
import { type ProbationStore } from '../hooks/use-probation'
import {
  peerReviewColumns,
  periodicReviewColumns,
  probationColumns,
} from './probation-columns'
import { ProbationDetailSheet } from './probation-detail-sheet'

const STATUS_FILTERS = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending with me' },
  { value: 'pending-approval', label: 'Pending Confirmation' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'extended', label: 'Extended Probation' },
  { value: 'separation-initiated', label: 'Terminated / Separation' },
]

interface ProbationTabProps {
  store: ProbationStore
  decisionTable: ProbationDecisionTable
}

/** Confirmation review dashboard + peer & periodic review grids. */
export function ProbationTab({ store, decisionTable }: ProbationTabProps) {
  const { role, hasRole } = useRole()
  const [status, setStatus] = useState('all')
  const [department, setDepartment] = useState('all')
  const [employeeState, setEmployeeState] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [peerFilters, setPeerFilters] = useState({
    employeeState: 'all',
    from: '',
    to: '',
    status: 'all',
  })
  const [periodicFilters, setPeriodicFilters] = useState({
    from: '',
    to: '',
    status: 'all',
  })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [peerDialog, setPeerDialog] = useState<PeerReview | null>(null)
  const [periodicDialog, setPeriodicDialog] = useState<PeriodicReview | null>(null)
  const [dialogText, setDialogText] = useState('')
  const [requestFor, setRequestFor] = useState('')
  const [requestReviewer, setRequestReviewer] = useState('')

  const cases = useMemo(
    () =>
      store.cases.filter((c) => {
        // Active/inactive workforce segment: separated employees are inactive.
        const isActive = c.status !== 'separation-initiated'
        return (
          (status === 'all' || c.status === status) &&
          (department === 'all' || c.department === department) &&
          (employeeState === 'all' ||
            (employeeState === 'active' ? isActive : !isActive)) &&
          (from === '' || c.dueDate >= from) &&
          (to === '' || c.dueDate <= to)
        )
      }),
    [department, employeeState, from, status, store.cases, to]
  )

  const peerReviews = useMemo(
    () =>
      store.peerReviews.filter(
        (r) =>
          (peerFilters.employeeState === 'all' ||
            (peerFilters.employeeState === 'active'
              ? r.employeeActive
              : !r.employeeActive)) &&
          (peerFilters.from === '' || r.reviewDate >= peerFilters.from) &&
          (peerFilters.to === '' || r.reviewDate <= peerFilters.to) &&
          (peerFilters.status === 'all' || r.status === peerFilters.status)
      ),
    [peerFilters, store.peerReviews]
  )

  const periodicReviews = useMemo(
    () =>
      store.periodicReviews.filter(
        (r) =>
          (periodicFilters.from === '' || r.periodTo >= periodicFilters.from) &&
          (periodicFilters.to === '' || r.periodFrom <= periodicFilters.to) &&
          (periodicFilters.status === 'all' ||
            r.status === periodicFilters.status)
      ),
    [periodicFilters, store.periodicReviews]
  )

  const selected = store.cases.find((c) => c.id === selectedId) ?? null
  const isAdmin = hasRole('Company Admin')

  const resetFilters = () => {
    setStatus('all')
    setDepartment('all')
    setEmployeeState('all')
    setFrom('')
    setTo('')
  }

  return (
    <div className='w-full'>
      <Tabs defaultValue='review' className='w-full'>
        <TabsList className='mb-2'>
          <TabsTrigger variant='primary' value='review'>
            Confirmation Review
          </TabsTrigger>
          <TabsTrigger variant='primary' value='peer'>
            Peer Review
          </TabsTrigger>
          <TabsTrigger variant='primary' value='periodic'>
            Periodic Review
          </TabsTrigger>
        </TabsList>

        <TabsContent value='review'>
          <div className='mb-3 flex flex-wrap items-center gap-2'>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger variant='secondary' className='h-7 w-[190px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger variant='secondary' className='h-7 w-[160px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All departments</SelectItem>
                {DEPARTMENTS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={employeeState} onValueChange={setEmployeeState}>
              <SelectTrigger variant='secondary' className='h-7 w-[170px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All employees</SelectItem>
                <SelectItem value='active'>Active employees</SelectItem>
                <SelectItem value='inactive'>Inactive employees</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type='date'
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className='h-7 w-[150px]'
              aria-label='Due from'
            />
            <Input
              type='date'
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className='h-7 w-[150px]'
              aria-label='Due to'
            />
            <Button size='sm' variant='outline' onClick={resetFilters}>
              Reset
            </Button>
          </div>
          <DataTable
            columns={probationColumns}
            data={cases}
            variant='no-status'
            onRowClick={(row: ProbationCase) => setSelectedId(row.id)}
          />
        </TabsContent>

        <TabsContent value='peer'>
          <div className='mb-3 flex flex-wrap items-center gap-2'>
            <Select
              value={peerFilters.employeeState}
              onValueChange={(v) =>
                setPeerFilters((f) => ({ ...f, employeeState: v }))
              }
            >
              <SelectTrigger variant='secondary' className='h-7 w-[170px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All employees</SelectItem>
                <SelectItem value='active'>Active employees</SelectItem>
                <SelectItem value='inactive'>Inactive employees</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type='date'
              value={peerFilters.from}
              onChange={(e) =>
                setPeerFilters((f) => ({ ...f, from: e.target.value }))
              }
              className='h-7 w-[150px]'
              aria-label='Requested from'
            />
            <Input
              type='date'
              value={peerFilters.to}
              onChange={(e) =>
                setPeerFilters((f) => ({ ...f, to: e.target.value }))
              }
              className='h-7 w-[150px]'
              aria-label='Requested to'
            />
            <Select
              value={peerFilters.status}
              onValueChange={(v) => setPeerFilters((f) => ({ ...f, status: v }))}
            >
              <SelectTrigger variant='secondary' className='h-7 w-[170px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All statuses</SelectItem>
                <SelectItem value='Pending Approval'>Pending Approval</SelectItem>
                <SelectItem value='Submitted'>Submitted</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size='sm'
              onClick={() =>
                toast.info(
                  `${peerReviews.length} peer review(s) match the current filters`
                )
              }
            >
              Search
            </Button>
            <Button
              size='sm'
              variant='outline'
              onClick={() => {
                setPeerFilters({
                  employeeState: 'all',
                  from: '',
                  to: '',
                  status: 'all',
                })
                toast.info('Peer review filters cleared')
              }}
            >
              Reset
            </Button>
          </div>
          {isAdmin && (
            <div className='mb-3 flex flex-wrap items-end gap-2'>
              <Input
                placeholder='Employee under confirmation'
                value={requestFor}
                onChange={(e) => setRequestFor(e.target.value)}
                className='h-7 w-[220px]'
              />
              <Input
                placeholder='Nominated reviewer'
                value={requestReviewer}
                onChange={(e) => setRequestReviewer(e.target.value)}
                className='h-7 w-[200px]'
              />
              <Button
                size='sm'
                onClick={() => {
                  if (!requestFor.trim() || !requestReviewer.trim()) {
                    toast.error('Enter both the employee and the reviewer')
                    return
                  }
                  store.requestPeerReview(
                    requestFor.trim(),
                    requestReviewer.trim(),
                    PERSONAS[role]
                  )
                  setRequestFor('')
                  setRequestReviewer('')
                }}
              >
                Request peer review
              </Button>
            </div>
          )}
          <DataTable
            columns={peerReviewColumns}
            data={peerReviews}
            variant='no-status'
            onRowClick={(row: PeerReview) => {
              if (row.status === 'Pending Approval') {
                setDialogText('')
                setPeerDialog(row)
              }
            }}
          />
        </TabsContent>

        <TabsContent value='periodic'>
          <div className='mb-3 flex flex-wrap items-center gap-2'>
            <Input
              type='date'
              value={periodicFilters.from}
              onChange={(e) =>
                setPeriodicFilters((f) => ({ ...f, from: e.target.value }))
              }
              className='h-7 w-[150px]'
              aria-label='Period from'
            />
            <Input
              type='date'
              value={periodicFilters.to}
              onChange={(e) =>
                setPeriodicFilters((f) => ({ ...f, to: e.target.value }))
              }
              className='h-7 w-[150px]'
              aria-label='Period to'
            />
            <Select
              value={periodicFilters.status}
              onValueChange={(v) =>
                setPeriodicFilters((f) => ({ ...f, status: v }))
              }
            >
              <SelectTrigger variant='secondary' className='h-7 w-[150px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All statuses</SelectItem>
                <SelectItem value='Active'>Active</SelectItem>
                <SelectItem value='Submitted'>Submitted</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size='sm'
              onClick={() =>
                toast.info(
                  `${periodicReviews.length} periodic review(s) match the current filters`
                )
              }
            >
              Search
            </Button>
            <Button
              size='sm'
              variant='outline'
              onClick={() => {
                setPeriodicFilters({ from: '', to: '', status: 'all' })
                toast.info('Periodic review filters cleared')
              }}
            >
              Reset
            </Button>
          </div>
          <DataTable
            columns={periodicReviewColumns}
            data={periodicReviews}
            variant='no-status'
            onRowClick={(row: PeriodicReview) => {
              if (row.status === 'Active') {
                setDialogText('')
                setPeriodicDialog(row)
              }
            }}
          />
        </TabsContent>
      </Tabs>

      <ProbationDetailSheet
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null)
        }}
        probationCase={selected}
        store={store}
        decisionTable={decisionTable}
      />

      {/* Submit peer feedback */}
      <Dialog
        open={peerDialog !== null}
        onOpenChange={(open) => {
          if (!open) setPeerDialog(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Peer review · {peerDialog?.employeeName}
            </DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder='Your feedback informs the confirmation decision'
            value={dialogText}
            onChange={(e) => setDialogText(e.target.value)}
          />
          <DialogFooter>
            <Button variant='outline' onClick={() => setPeerDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!dialogText.trim()) {
                  toast.error('Feedback is required before submitting')
                  return
                }
                if (peerDialog) store.submitPeerReview(peerDialog.id, dialogText.trim())
                setPeerDialog(null)
              }}
            >
              Submit feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit periodic feedback */}
      <Dialog
        open={periodicDialog !== null}
        onOpenChange={(open) => {
          if (!open) setPeriodicDialog(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Periodic review · {periodicDialog?.employeeName}
            </DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder='Interim feedback for this review window'
            value={dialogText}
            onChange={(e) => setDialogText(e.target.value)}
          />
          <DialogFooter>
            <Button variant='outline' onClick={() => setPeriodicDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!dialogText.trim()) {
                  toast.error('Notes are required before submitting')
                  return
                }
                if (periodicDialog)
                  store.submitPeriodicReview(periodicDialog.id, dialogText.trim())
                setPeriodicDialog(null)
              }}
            >
              Submit review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
