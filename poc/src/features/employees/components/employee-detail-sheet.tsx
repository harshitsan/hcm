import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RoleGate } from '@/context/role-context'
import {
  companyGroup,
  companyName,
  LIFECYCLE_STAGES,
  type Employee,
  type LifecycleStage,
  type ManagerChange,
} from '../data/employees'
import { InfoField, SectionTitle, StatusBadge } from './shared'

interface EmployeeDetailSheetProps {
  employee: Employee | null
  open: boolean
  onOpenChange: (open: boolean) => void
  managerChanges: ManagerChange[]
  /** Directory scope — targets for the admin role-reassignment action. */
  employees: Employee[]
  onRecordLifecycleEvent: (
    id: string,
    type: LifecycleStage,
    note: string,
    date: string
  ) => void
  onRunEngines: (id: string) => void
  onLinkUserAccount: (id: string, link: boolean) => void
  onReassignRoles: (sourceId: string, targetId: string) => void
  onInitiateSuspension: (
    id: string,
    reason: string,
    from: string,
    to: string
  ) => void
}

/**
 * Read-oriented employee record: organizational placement, reporting lines
 * with effective-dated audit trail, statutory & leave data (engine-computed)
 * and the lifecycle event timeline. Company Admin gets write actions; group /
 * portfolio admins see everything read-only within their scope.
 */
export function EmployeeDetailSheet({
  employee,
  open,
  onOpenChange,
  managerChanges,
  employees,
  onRecordLifecycleEvent,
  onRunEngines,
  onLinkUserAccount,
  onReassignRoles,
  onInitiateSuspension,
}: EmployeeDetailSheetProps) {
  const [eventType, setEventType] = useState<LifecycleStage>('Probation')
  const [eventDate, setEventDate] = useState('')
  const [eventNote, setEventNote] = useState('')
  const [reassignOpen, setReassignOpen] = useState(false)
  const [reassignTarget, setReassignTarget] = useState('')
  const [suspendOpen, setSuspendOpen] = useState(false)
  const [suspendReason, setSuspendReason] = useState('')
  const [suspendFrom, setSuspendFrom] = useState('')
  const [suspendTo, setSuspendTo] = useState('')

  if (!employee) return null
  const audit = managerChanges.filter(
    (c) => c.employeeName === employee.name
  )
  const reassignTargets = employees.filter(
    (e) => e.id !== employee.id && e.lifecycleStage !== 'Exited'
  )

  const recordEvent = () => {
    if (!eventDate) return
    onRecordLifecycleEvent(employee.id, eventType, eventNote, eventDate)
    setEventNote('')
    setEventDate('')
  }

  const confirmReassign = () => {
    if (!reassignTarget) return
    onReassignRoles(employee.id, reassignTarget)
    setReassignOpen(false)
    setReassignTarget('')
  }

  const confirmSuspend = () => {
    if (!suspendReason || !suspendFrom || !suspendTo) return
    onInitiateSuspension(employee.id, suspendReason, suspendFrom, suspendTo)
    setSuspendOpen(false)
    setSuspendReason('')
    setSuspendFrom('')
    setSuspendTo('')
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[620px]'>
        <SheetHeader className='border-grey-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md flex flex-wrap items-center gap-2 font-semibold'>
            {employee.name}
            <span className='text-neutral-1000 text-sm font-normal'>
              {employee.code}
            </span>
            <StatusBadge status={employee.lifecycleStage} />
          </SheetTitle>
          <div className='flex flex-wrap items-center gap-1.5 pt-1'>
            <Badge variant='open'>{companyName(employee.companyId)}</Badge>
            <Badge variant='pending'>{companyGroup(employee.companyId)}</Badge>
            <Badge variant={employee.hasUserAccount ? 'qualified' : 'badge_inactive'}>
              {employee.hasUserAccount ? 'User account linked' : 'No user account'}
            </Badge>
          </div>
        </SheetHeader>

        <Tabs defaultValue='overview' className='flex min-h-0 flex-1 flex-col gap-0'>
          <TabsList className='mx-5 mt-3'>
            <TabsTrigger value='overview'>Overview</TabsTrigger>
            <TabsTrigger value='reporting'>Reporting</TabsTrigger>
            <TabsTrigger value='statutory'>Statutory & Leave</TabsTrigger>
            <TabsTrigger value='lifecycle'>Lifecycle</TabsTrigger>
          </TabsList>

          <div className='min-h-0 flex-1 overflow-y-auto px-5 py-4'>
            <TabsContent value='overview' className='space-y-4'>
              <SectionTitle>Organizational placement</SectionTitle>
              <div className='grid grid-cols-2 gap-4'>
                <InfoField label='Company' value={companyName(employee.companyId)} />
                <InfoField label='Jurisdiction' value={employee.jurisdiction} />
                <InfoField
                  label='Departments'
                  value={employee.departments.join(', ')}
                />
                <InfoField label='Position' value={employee.position} />
                <InfoField
                  label='Groups'
                  value={employee.groups.length ? employee.groups.join(', ') : 'None (optional)'}
                />
                <InfoField
                  label='Operating locations'
                  value={employee.locations.join(', ')}
                />
                <InfoField label='Employee class' value={employee.employeeClass} />
                <InfoField label='Date of joining' value={employee.joinDate} />
                <InfoField label='Gender' value={employee.gender} />
                <InfoField
                  label='Functional location'
                  value={employee.functionalLocation}
                />
                <InfoField label='Position level' value={employee.positionLevel} />
                <InfoField
                  label='Roles'
                  value={
                    employee.roles.length
                      ? employee.roles.join(', ')
                      : 'No roles assigned'
                  }
                />
                <InfoField
                  label='LinkedIn'
                  value={employee.socialMediaLinkedIn}
                />
                <InfoField
                  label='Twitter / X'
                  value={employee.socialMediaTwitter}
                />
                <InfoField
                  label='Attendance tracking'
                  value={employee.attendanceTracked ? 'Tracked' : 'Not tracked'}
                />
                <InfoField
                  label='Absconding alerts'
                  value={
                    employee.abscondingAlertsEnabled ? 'Enabled' : 'Disabled'
                  }
                />
                <InfoField
                  label='Supervisor approval'
                  value={
                    employee.supervisorApprovalRequired
                      ? 'Required'
                      : 'Not required'
                  }
                />
              </div>
              {employee.roleTransferNote && (
                <p className='text-paragraph-sm text-neutral-1000 rounded-md border border-gray-200 px-3 py-2'>
                  {employee.roleTransferNote}
                </p>
              )}
              {employee.suspension && (
                <p className='text-paragraph-sm rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-700'>
                  Suspended {employee.suspension.from} →{' '}
                  {employee.suspension.to} — {employee.suspension.reason}
                </p>
              )}
              <RoleGate roles={['Company Admin']}>
                <div className='flex items-center justify-between rounded-md border border-gray-200 px-3 py-2'>
                  <p className='text-paragraph-sm text-neutral-1000'>
                    Transfer this employee's role assignments to another
                    employee (audit note recorded on both records).
                  </p>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setReassignOpen(true)}
                    disabled={employee.roles.length === 0}
                  >
                    Reassign roles
                  </Button>
                </div>
              </RoleGate>
              <RoleGate roles={['Company Admin']}>
                <div className='flex items-center justify-between rounded-md border border-gray-200 px-3 py-2'>
                  <p className='text-paragraph-sm text-neutral-1000'>
                    {employee.hasUserAccount
                      ? 'Unlinking keeps the employee record intact.'
                      : 'Linking enables access without duplicating the record.'}
                  </p>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() =>
                      onLinkUserAccount(employee.id, !employee.hasUserAccount)
                    }
                  >
                    {employee.hasUserAccount ? 'Unlink user account' : 'Link user account'}
                  </Button>
                </div>
              </RoleGate>
              <SectionTitle>Dependants & life events</SectionTitle>
              {employee.dependants.length === 0 ? (
                <p className='text-paragraph-sm text-neutral-1000'>
                  No dependants recorded.
                </p>
              ) : (
                <ul className='space-y-1'>
                  {employee.dependants.map((d) => (
                    <li key={d.id} className='text-sm'>
                      <span className='font-medium'>{d.name}</span>{' '}
                      <span className='text-neutral-1000'>
                        — {d.relationship}, b. {d.dateOfBirth}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {employee.lifeEvents.map((e) => (
                <p key={e.id} className='text-paragraph-sm text-neutral-1000'>
                  Life event: <span className='font-medium'>{e.type}</span> on{' '}
                  {e.date} — {e.details}
                </p>
              ))}
            </TabsContent>

            <TabsContent value='reporting' className='space-y-4'>
              <SectionTitle>Current reporting (as of today)</SectionTitle>
              <div className='grid grid-cols-2 gap-4'>
                <InfoField
                  label='Primary manager (exactly one)'
                  value={employee.primaryManager}
                />
                <InfoField
                  label='Effective from'
                  value={employee.managerEffectiveDate}
                />
                <InfoField
                  label='Dotted-line managers'
                  value={
                    employee.dottedLineManagers.length
                      ? employee.dottedLineManagers.join(', ')
                      : 'None (optional)'
                  }
                />
              </div>
              <SectionTitle>Manager change audit trail</SectionTitle>
              {audit.length === 0 ? (
                <p className='text-paragraph-sm text-neutral-1000'>
                  No manager changes recorded for this employee.
                </p>
              ) : (
                <ul className='space-y-2'>
                  {audit.map((c) => (
                    <li
                      key={c.id}
                      className='rounded-md border border-gray-200 px-3 py-2 text-sm'
                    >
                      <div className='flex items-center gap-2'>
                        <Badge variant='open'>{c.changeType}</Badge>
                        <span>
                          {c.from} → <span className='font-medium'>{c.to}</span>
                        </span>
                      </div>
                      <p className='text-paragraph-sm text-neutral-1000 pt-1'>
                        Effective {c.effectiveDate}
                        {c.endDate ? ` to ${c.endDate}` : ''} · changed by{' '}
                        {c.changedBy} on {c.changedOn}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>

            <TabsContent value='statutory' className='space-y-4'>
              <SectionTitle>Statutory identifiers</SectionTitle>
              <div className='grid grid-cols-2 gap-4'>
                <InfoField label='UAN' value={employee.uan} />
                <InfoField label='ESIC number' value={employee.esicNumber} />
                <InfoField label='Aadhar' value={employee.aadhar} />
                <InfoField label='PAN' value={employee.pan} />
                <InfoField label='Passport' value={employee.passport} />
                <InfoField
                  label='Professional Tax'
                  value={employee.ptRegistered ? 'Registered' : 'Not registered'}
                />
                <InfoField
                  label='LWF'
                  value={employee.lwfApplicable ? 'Applicable' : 'Not applicable'}
                />
              </div>
              <SectionTitle>Engine-determined eligibility</SectionTitle>
              <div className='grid grid-cols-3 gap-4'>
                <InfoField
                  label='ESI / PF'
                  value={<StatusBadge status={employee.esiPfEligibility} />}
                />
                <InfoField
                  label='Maternity benefit'
                  value={<StatusBadge status={employee.maternityEligibility} />}
                />
                <InfoField
                  label='Gratuity'
                  value={<StatusBadge status={employee.gratuityEligibility} />}
                />
              </div>
              <p className='text-paragraph-sm text-neutral-1000'>
                Determined by the Rules engine from rule-pack{' '}
                <span className='font-medium'>{employee.evaluatedRulePack}</span>{' '}
                — inputs and version recorded for audit.
              </p>
              <SectionTitle>Leave balances vs statutory entitlement</SectionTitle>
              <ul className='space-y-1.5'>
                {employee.leaveBalances.map((b) => (
                  <li
                    key={b.type}
                    className='flex items-center justify-between rounded-md border border-gray-200 px-3 py-1.5 text-sm'
                  >
                    <span className='font-medium'>{b.type}</span>
                    <span className='text-neutral-1000'>
                      {b.balance} available · {b.statutoryEntitlement}/yr statutory
                    </span>
                  </li>
                ))}
              </ul>
              <RoleGate roles={['Company Admin']}>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => onRunEngines(employee.id)}
                >
                  Re-evaluate eligibility & run accrual
                </Button>
              </RoleGate>
            </TabsContent>

            <TabsContent value='lifecycle' className='space-y-4'>
              <SectionTitle>Lifecycle timeline</SectionTitle>
              <ul className='space-y-2'>
                {[...employee.lifecycleEvents].reverse().map((e) => (
                  <li
                    key={e.id}
                    className='rounded-md border border-gray-200 px-3 py-2 text-sm'
                  >
                    <div className='flex items-center gap-2'>
                      <StatusBadge status={e.type} />
                      <span className='text-neutral-1000'>{e.date}</span>
                    </div>
                    <p className='pt-1'>{e.note}</p>
                  </li>
                ))}
              </ul>
              <RoleGate roles={['Company Admin']}>
                <SectionTitle>Record lifecycle event</SectionTitle>
                <div className='grid grid-cols-2 gap-3'>
                  <Select
                    value={eventType}
                    onValueChange={(v) => setEventType(v as LifecycleStage)}
                  >
                    <SelectTrigger variant='secondary' className='w-full'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LIFECYCLE_STAGES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type='date'
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                  />
                  <Input
                    className='col-span-2'
                    placeholder='Note (e.g. transfer to Supply Chain — org changes applied)'
                    value={eventNote}
                    onChange={(e) => setEventNote(e.target.value)}
                  />
                </div>
                <Button size='sm' onClick={recordEvent} disabled={!eventDate}>
                  Record event
                </Button>
                <p className='text-paragraph-sm text-neutral-1000'>
                  Exit keeps history retained; the Notification engine informs
                  the employee and affected managers per configured templates.
                </p>
                <SectionTitle>Initiate suspension</SectionTitle>
                <div className='flex items-center justify-between rounded-md border border-gray-200 px-3 py-2'>
                  <p className='text-paragraph-sm text-neutral-1000'>
                    {employee.suspension
                      ? `Suspension on record: ${employee.suspension.from} → ${employee.suspension.to}`
                      : 'Sets the Suspended status with a reason and a from/to window.'}
                  </p>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setSuspendOpen(true)}
                    disabled={employee.lifecycleStage === 'Suspended'}
                  >
                    Initiate Suspension
                  </Button>
                </div>
              </RoleGate>
            </TabsContent>
          </div>
        </Tabs>

        <Dialog open={reassignOpen} onOpenChange={setReassignOpen}>
          <DialogContent className='sm:max-w-[400px]'>
            <DialogHeader>
              <DialogTitle>Reassign roles — {employee.name}</DialogTitle>
            </DialogHeader>
            <div className='space-y-3'>
              <p className='text-paragraph-sm text-neutral-1000'>
                Transfers{' '}
                <span className='text-neutral-1600 font-medium'>
                  {employee.roles.join(', ') || '—'}
                </span>{' '}
                to the selected employee. This employee keeps no role
                assignments afterwards.
              </p>
              <div className='space-y-1'>
                <Label>Transfer role assignments to</Label>
                <Select value={reassignTarget} onValueChange={setReassignTarget}>
                  <SelectTrigger variant='secondary' className='w-full'>
                    <SelectValue placeholder='Select employee' />
                  </SelectTrigger>
                  <SelectContent>
                    {reassignTargets.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name} ({e.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant='outline' onClick={() => setReassignOpen(false)}>
                Cancel
              </Button>
              <Button onClick={confirmReassign} disabled={!reassignTarget}>
                Transfer roles
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={suspendOpen} onOpenChange={setSuspendOpen}>
          <DialogContent className='sm:max-w-[420px]'>
            <DialogHeader>
              <DialogTitle>Initiate suspension — {employee.name}</DialogTitle>
            </DialogHeader>
            <div className='space-y-3'>
              <div className='space-y-1'>
                <Label>Reason</Label>
                <Input
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder='e.g. Pending disciplinary inquiry'
                />
              </div>
              <div className='grid grid-cols-2 gap-3'>
                <div className='space-y-1'>
                  <Label>Suspension from</Label>
                  <Input
                    type='date'
                    value={suspendFrom}
                    onChange={(e) => setSuspendFrom(e.target.value)}
                  />
                </div>
                <div className='space-y-1'>
                  <Label>Suspension to</Label>
                  <Input
                    type='date'
                    value={suspendTo}
                    onChange={(e) => setSuspendTo(e.target.value)}
                  />
                </div>
              </div>
              <p className='text-paragraph-sm text-neutral-1000'>
                The employee's status changes to Suspended and the window is
                recorded on the lifecycle timeline.
              </p>
            </div>
            <DialogFooter>
              <Button variant='outline' onClick={() => setSuspendOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={confirmSuspend}
                disabled={!suspendReason || !suspendFrom || !suspendTo}
              >
                Confirm suspension
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </FloatingSheetContent>
    </Sheet>
  )
}
