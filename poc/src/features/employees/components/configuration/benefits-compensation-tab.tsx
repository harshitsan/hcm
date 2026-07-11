import { useMemo, useState } from 'react'
import { ArrowsClockwise, CaretLeft, CaretRight, Plus, Trash } from 'phosphor-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RoleGate, useRole } from '@/context/role-context'
import { EMPLOYEE_CLASSES } from '../../data/employees'
import {
  type ClientRecord,
  type ExpenseHead,
  type SalarySlab,
} from '../../data/configuration'
import { type ConfigurationStore } from '../../hooks/use-configuration'
import { SectionTitle } from '../shared'

const SLAB_PAGE_SIZE = 5

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`

/**
 * BEN-01..03 benefit-management setup, COMP-01..08 salary slabs with
 * accepted-difference tolerance and Save / Save & Next / Cancel, plus the
 * Expense Head and Rehire Settings tabs (COMP-06) and the Client Master
 * (CLM-01/02) — all on the in-memory configuration store.
 */
export function BenefitsCompensationTab({
  store,
}: {
  store: ConfigurationStore
}) {
  const [tab, setTab] = useState('benefits')

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList className='mb-3'>
        <TabsTrigger value='benefits'>Benefits Setup</TabsTrigger>
        <TabsTrigger value='compensation'>Compensation</TabsTrigger>
        <TabsTrigger value='expense-head'>Expense Head</TabsTrigger>
        <TabsTrigger value='rehire'>Rehire Settings</TabsTrigger>
        <TabsTrigger value='clients'>Client Master</TabsTrigger>
      </TabsList>

      <TabsContent value='benefits'>
        <BenefitsSetupSection store={store} />
      </TabsContent>
      <TabsContent value='compensation'>
        <CompensationSection
          store={store}
          onSaveAndNext={() => setTab('expense-head')}
        />
      </TabsContent>
      <TabsContent value='expense-head'>
        <ExpenseHeadSection store={store} />
      </TabsContent>
      <TabsContent value='rehire'>
        <RehireSettingsSection store={store} />
      </TabsContent>
      <TabsContent value='clients'>
        <ClientMasterSection store={store} />
      </TabsContent>
    </Tabs>
  )
}

/** BEN-01/02/03 — enable/disable the benefit module with Save and Cancel. */
function BenefitsSetupSection({ store }: { store: ConfigurationStore }) {
  const { hasRole } = useRole()
  const canEdit = hasRole('Company Admin', 'Platform Admin')
  const [draftEnabled, setDraftEnabled] = useState(
    store.benefitsSetup.moduleEnabled
  )
  const dirty = draftEnabled !== store.benefitsSetup.moduleEnabled

  return (
    <div className='max-w-xl space-y-4'>
      <SectionTitle>Benefit management setup</SectionTitle>
      <div className='rounded-md border border-gray-200 bg-white p-4'>
        <div className='flex items-center justify-between gap-4'>
          <div>
            <p className='text-neutral-1600 text-sm font-medium'>
              Enable benefit management module
            </p>
            <p className='text-paragraph-sm text-neutral-1000 pt-0.5'>
              Controls whether benefits functionality (plans, enrollments,
              dependant coverage) is available across the HRMS.
            </p>
          </div>
          <Switch
            checked={draftEnabled}
            disabled={!canEdit}
            onCheckedChange={setDraftEnabled}
            aria-label='Enable benefit management module'
          />
        </div>
        <div className='pt-3'>
          <Badge
            variant={
              store.benefitsSetup.moduleEnabled ? 'badge_active' : 'badge_inactive'
            }
          >
            Currently {store.benefitsSetup.moduleEnabled ? 'enabled' : 'disabled'}
          </Badge>
        </div>
      </div>
      {canEdit && (
        <div className='flex items-center gap-3'>
          <Button
            size='sm'
            disabled={!dirty}
            onClick={() => store.saveBenefitsSetup({ moduleEnabled: draftEnabled })}
          >
            Save
          </Button>
          <Button
            size='sm'
            variant='outline'
            disabled={!dirty}
            onClick={() => {
              setDraftEnabled(store.benefitsSetup.moduleEnabled)
              toast.info('Benefit setup changes discarded')
            }}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}

/** COMP-01..05, 07/08 — slab list + accepted difference + Save/Save & Next. */
function CompensationSection({
  store,
  onSaveAndNext,
}: {
  store: ConfigurationStore
  onSaveAndNext: () => void
}) {
  const [page, setPage] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<SalarySlab | null>(null)
  const [deleting, setDeleting] = useState<SalarySlab | null>(null)

  const [name, setName] = useState('')
  const [classSpecific, setClassSpecific] = useState(false)
  const [employeeClass, setEmployeeClass] = useState<string>(
    EMPLOYEE_CLASSES[0]
  )
  const [rangeMin, setRangeMin] = useState('')
  const [rangeMax, setRangeMax] = useState('')

  const [acceptedDiff, setAcceptedDiff] = useState(
    String(store.compensationSettings.acceptedSalaryDifference)
  )
  const dirty =
    acceptedDiff !== String(store.compensationSettings.acceptedSalaryDifference)

  const pageCount = Math.max(
    1,
    Math.ceil(store.salarySlabs.length / SLAB_PAGE_SIZE)
  )
  const safePage = Math.min(page, pageCount - 1)
  const pageRows = useMemo(
    () =>
      store.salarySlabs.slice(
        safePage * SLAB_PAGE_SIZE,
        safePage * SLAB_PAGE_SIZE + SLAB_PAGE_SIZE
      ),
    [store.salarySlabs, safePage]
  )

  const openFor = (slab: SalarySlab | null) => {
    setEditing(slab)
    setName(slab?.name ?? '')
    setClassSpecific(slab?.classSpecific ?? false)
    setEmployeeClass(slab?.employeeClass ?? EMPLOYEE_CLASSES[0])
    setRangeMin(slab ? String(slab.rangeMin) : '')
    setRangeMax(slab ? String(slab.rangeMax) : '')
    setDialogOpen(true)
  }

  const valid =
    name.trim() !== '' &&
    Number(rangeMin) > 0 &&
    Number(rangeMax) > Number(rangeMin)

  const submit = () => {
    if (!valid) return
    store.saveSalarySlab(
      {
        name: name.trim(),
        classSpecific,
        employeeClass: classSpecific ? employeeClass : null,
        rangeMin: Number(rangeMin),
        rangeMax: Number(rangeMax),
      },
      editing?.id
    )
    setDialogOpen(false)
  }

  const save = () => {
    store.saveCompensationSettings({
      acceptedSalaryDifference: Number(acceptedDiff) || 0,
    })
  }

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <SectionTitle>Salary slabs (compensation metrics)</SectionTitle>
        <div className='flex items-center gap-2'>
          <Button
            variant='icon2'
            className='text-neutral-1900 h-7 w-7'
            aria-label='Refresh slab list'
            onClick={() => {
              setPage(0)
              toast.success('Slab list refreshed — showing the latest data')
            }}
          >
            <ArrowsClockwise size={16} weight='bold' />
          </Button>
          <RoleGate roles={['Company Admin', 'Platform Admin']}>
            <Button size='sm' onClick={() => openFor(null)}>
              <Plus size={12} weight='bold' />
              Add new salary metrics
            </Button>
          </RoleGate>
        </div>
      </div>

      <div className='rounded-md border border-gray-200 bg-white'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Employee class specific</TableHead>
              <TableHead>Employee class</TableHead>
              <TableHead>Slab range (annual)</TableHead>
              <TableHead className='w-[160px]' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((s) => (
              <TableRow key={s.id}>
                <TableCell className='font-medium'>{s.name}</TableCell>
                <TableCell>
                  <Badge variant={s.classSpecific ? 'badge_active' : 'pending'}>
                    {s.classSpecific ? 'Class-specific' : 'All classes'}
                  </Badge>
                </TableCell>
                <TableCell className='text-neutral-1000'>
                  {s.employeeClass ?? '—'}
                </TableCell>
                <TableCell className='text-neutral-1000'>
                  {inr(s.rangeMin)} – {inr(s.rangeMax)}
                </TableCell>
                <TableCell>
                  <RoleGate roles={['Company Admin', 'Platform Admin']}>
                    <div className='flex justify-end gap-1'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => openFor(s)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant='icon2'
                        className='text-neutral-1900 h-7 w-7'
                        aria-label={`Delete ${s.name}`}
                        onClick={() => setDeleting(s)}
                      >
                        <Trash size={14} weight='bold' />
                      </Button>
                    </div>
                  </RoleGate>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className='flex items-center justify-between'>
        <p className='text-paragraph-sm text-neutral-1000'>
          {store.salarySlabs.length} slab
          {store.salarySlabs.length === 1 ? '' : 's'} configured
        </p>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            disabled={safePage === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            <CaretLeft size={12} weight='bold' />
            Prev
          </Button>
          <span className='text-paragraph-sm text-neutral-1000'>
            Page {safePage + 1} of {pageCount}
          </span>
          <Button
            variant='outline'
            size='sm'
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          >
            Next
            <CaretRight size={12} weight='bold' />
          </Button>
        </div>
      </div>

      <RoleGate roles={['Company Admin', 'Platform Admin']}>
        <div className='max-w-xl space-y-3'>
          <SectionTitle>Salary processing tolerance</SectionTitle>
          <div className='space-y-1'>
            <Label>
              Accepted difference between provided and calculated salary (₹)
            </Label>
            <Input
              type='number'
              min={0}
              value={acceptedDiff}
              onChange={(e) => setAcceptedDiff(e.target.value)}
            />
            <p className='text-paragraph-sm text-neutral-1000'>
              Discrepancies within this amount are tolerated during salary
              processing instead of raising an exception.
            </p>
          </div>
          <div className='flex items-center gap-3'>
            <Button size='sm' onClick={save}>
              Save
            </Button>
            <Button
              size='sm'
              variant='outline'
              onClick={() => {
                save()
                onSaveAndNext()
              }}
            >
              Save & Next
            </Button>
            <Button
              size='sm'
              variant='outline'
              disabled={!dirty}
              onClick={() => {
                setAcceptedDiff(
                  String(store.compensationSettings.acceptedSalaryDifference)
                )
                toast.info('Compensation changes discarded')
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </RoleGate>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='sm:max-w-[420px]'>
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Edit salary slab' : 'Add new salary metrics'}
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='space-y-1'>
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='e.g. Mid-level band'
              />
            </div>
            <div className='flex items-center justify-between rounded-md border border-gray-200 px-3 py-2'>
              <Label>Employee class specific</Label>
              <Switch
                checked={classSpecific}
                onCheckedChange={setClassSpecific}
              />
            </div>
            {classSpecific && (
              <div className='space-y-1'>
                <Label>Employee class</Label>
                <Select value={employeeClass} onValueChange={setEmployeeClass}>
                  <SelectTrigger variant='secondary' className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYEE_CLASSES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1'>
                <Label>Range from (₹)</Label>
                <Input
                  type='number'
                  min={0}
                  value={rangeMin}
                  onChange={(e) => setRangeMin(e.target.value)}
                />
              </div>
              <div className='space-y-1'>
                <Label>Range to (₹)</Label>
                <Input
                  type='number'
                  min={0}
                  value={rangeMax}
                  onChange={(e) => setRangeMax(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={!valid}>
              {editing ? 'Save slab' : 'Add slab'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(o) => {
          if (!o) setDeleting(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete salary slab?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleting?.name}” will be removed from the compensation
              configuration. Existing salary records are unaffected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleting) store.deleteSalarySlab(deleting.id)
                setDeleting(null)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/** COMP-06 — expense heads configured alongside compensation. */
function ExpenseHeadSection({ store }: { store: ConfigurationStore }) {
  const { hasRole } = useRole()
  const canEdit = hasRole('Company Admin', 'Platform Admin')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ExpenseHead | null>(null)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Earning')

  const openFor = (head: ExpenseHead | null) => {
    setEditing(head)
    setName(head?.name ?? '')
    setCategory(head?.category ?? 'Earning')
    setOpen(true)
  }

  const submit = () => {
    if (!name.trim()) return
    store.saveExpenseHead(
      {
        name: name.trim(),
        category,
        active: editing?.active ?? true,
      },
      editing?.id
    )
    setOpen(false)
  }

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <SectionTitle>Expense heads</SectionTitle>
        <RoleGate roles={['Company Admin', 'Platform Admin']}>
          <Button size='sm' onClick={() => openFor(null)}>
            <Plus size={12} weight='bold' />
            Add expense head
          </Button>
        </RoleGate>
      </div>
      <div className='rounded-md border border-gray-200 bg-white'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className='w-[80px]' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {store.expenseHeads.map((h) => (
              <TableRow key={h.id}>
                <TableCell className='font-medium'>{h.name}</TableCell>
                <TableCell>
                  <Badge variant={h.category === 'Earning' ? 'badge_active' : 'overdue'}>
                    {h.category}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={h.active}
                    disabled={!canEdit}
                    onCheckedChange={() => store.toggleExpenseHead(h.id)}
                    aria-label={`Toggle ${h.name}`}
                  />
                </TableCell>
                <TableCell>
                  {canEdit && (
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => openFor(h)}
                    >
                      Edit
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className='text-paragraph-sm text-neutral-1000'>
        Expense heads feed salary structure composition and payroll exports.
      </p>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='sm:max-w-[360px]'>
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Edit expense head' : 'New expense head'}
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='space-y-1'>
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='e.g. Conveyance Allowance'
              />
            </div>
            <div className='space-y-1'>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='Earning'>Earning</SelectItem>
                  <SelectItem value='Deduction'>Deduction</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={!name.trim()}>
              {editing ? 'Save' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/** COMP-06 — rehire settings tab. */
function RehireSettingsSection({ store }: { store: ConfigurationStore }) {
  const { hasRole } = useRole()
  const canEdit = hasRole('Company Admin', 'Platform Admin')
  const [allowRehire, setAllowRehire] = useState(
    store.rehireSettings.allowRehire
  )
  const [cooling, setCooling] = useState(
    String(store.rehireSettings.coolingPeriodMonths)
  )
  const [requireApproval, setRequireApproval] = useState(
    store.rehireSettings.requireApproval
  )

  const dirty =
    allowRehire !== store.rehireSettings.allowRehire ||
    cooling !== String(store.rehireSettings.coolingPeriodMonths) ||
    requireApproval !== store.rehireSettings.requireApproval

  return (
    <div className='max-w-xl space-y-4'>
      <SectionTitle>Rehire settings</SectionTitle>
      <div className='space-y-3 rounded-md border border-gray-200 bg-white p-4'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-neutral-1600 text-sm font-medium'>
              Allow rehiring of exited employees
            </p>
            <p className='text-paragraph-sm text-neutral-1000'>
              Exited records stay linkable so history is preserved on rehire.
            </p>
          </div>
          <Switch
            checked={allowRehire}
            disabled={!canEdit}
            onCheckedChange={setAllowRehire}
            aria-label='Allow rehire'
          />
        </div>
        <div className='space-y-1'>
          <Label>Cooling period (months)</Label>
          <Input
            type='number'
            min={0}
            value={cooling}
            disabled={!canEdit || !allowRehire}
            onChange={(e) => setCooling(e.target.value)}
          />
        </div>
        <div className='flex items-center justify-between'>
          <p className='text-neutral-1600 text-sm font-medium'>
            Require HR approval for rehire
          </p>
          <Switch
            checked={requireApproval}
            disabled={!canEdit || !allowRehire}
            onCheckedChange={setRequireApproval}
            aria-label='Require approval for rehire'
          />
        </div>
      </div>
      {canEdit && (
        <div className='flex items-center gap-3'>
          <Button
            size='sm'
            disabled={!dirty}
            onClick={() =>
              store.saveRehireSettings({
                allowRehire,
                coolingPeriodMonths: Number(cooling) || 0,
                requireApproval,
              })
            }
          >
            Save
          </Button>
          <Button
            size='sm'
            variant='outline'
            disabled={!dirty}
            onClick={() => {
              setAllowRehire(store.rehireSettings.allowRehire)
              setCooling(String(store.rehireSettings.coolingPeriodMonths))
              setRequireApproval(store.rehireSettings.requireApproval)
              toast.info('Rehire setting changes discarded')
            }}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}

/** CLM-01/02 — client master with add, edit and delete. */
function ClientMasterSection({ store }: { store: ConfigurationStore }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ClientRecord | null>(null)
  const [deleting, setDeleting] = useState<ClientRecord | null>(null)
  const [name, setName] = useState('')
  const [createdOn, setCreatedOn] = useState('')
  const [billable, setBillable] = useState(true)
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')

  const openFor = (client: ClientRecord | null) => {
    setEditing(client)
    setName(client?.name ?? '')
    setCreatedOn(client?.createdOn ?? new Date().toISOString().slice(0, 10))
    setBillable(client?.billable ?? true)
    setEmail(client?.email ?? '')
    setAddress(client?.address ?? '')
    setOpen(true)
  }

  const valid =
    name.trim() !== '' && createdOn !== '' && email.trim() !== '' &&
    address.trim() !== ''

  const submit = () => {
    if (!valid) return
    store.saveClient(
      {
        name: name.trim(),
        createdOn,
        billable,
        email: email.trim(),
        address: address.trim(),
      },
      editing?.id
    )
    setOpen(false)
  }

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <SectionTitle>Client master</SectionTitle>
        <RoleGate roles={['Company Admin', 'Platform Admin']}>
          <Button size='sm' onClick={() => openFor(null)}>
            <Plus size={12} weight='bold' />
            Add client
          </Button>
        </RoleGate>
      </div>
      <div className='rounded-md border border-gray-200 bg-white'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client name</TableHead>
              <TableHead>Created on</TableHead>
              <TableHead>Billable</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className='w-[160px]' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {store.clients.map((c) => (
              <TableRow key={c.id}>
                <TableCell className='font-medium'>{c.name}</TableCell>
                <TableCell className='text-neutral-1000'>
                  {c.createdOn}
                </TableCell>
                <TableCell>
                  <Badge variant={c.billable ? 'badge_active' : 'badge_inactive'}>
                    {c.billable ? 'Billable' : 'Non-billable'}
                  </Badge>
                </TableCell>
                <TableCell className='text-neutral-1000'>{c.email}</TableCell>
                <TableCell className='text-neutral-1000 max-w-[220px] truncate'>
                  {c.address}
                </TableCell>
                <TableCell>
                  <RoleGate roles={['Company Admin', 'Platform Admin']}>
                    <div className='flex justify-end gap-1'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => openFor(c)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant='icon2'
                        className='text-neutral-1900 h-7 w-7'
                        aria-label={`Delete ${c.name}`}
                        onClick={() => setDeleting(c)}
                      >
                        <Trash size={14} weight='bold' />
                      </Button>
                    </div>
                  </RoleGate>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className='text-paragraph-sm text-neutral-1000'>
        Clients configured here become available for resource assignments in
        Projects.
      </p>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='sm:max-w-[420px]'>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit client' : 'New client'}</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='space-y-1'>
              <Label>Client name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='e.g. Acme Manufacturing'
              />
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1'>
                <Label>Creation date</Label>
                <Input
                  type='date'
                  value={createdOn}
                  onChange={(e) => setCreatedOn(e.target.value)}
                />
              </div>
              <div className='flex items-end justify-between rounded-md border border-gray-200 px-3 py-2'>
                <Label>Billable</Label>
                <Switch checked={billable} onCheckedChange={setBillable} />
              </div>
            </div>
            <div className='space-y-1'>
              <Label>Email</Label>
              <Input
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='e.g. billing@client.example'
              />
            </div>
            <div className='space-y-1'>
              <Label>Address</Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder='Street, city'
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={!valid}>
              {editing ? 'Save client' : 'Add client'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(o) => {
          if (!o) setDeleting(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete client?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleting?.name}” will no longer be available for resource
              assignments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleting) store.deleteClient(deleting.id)
                setDeleting(null)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
