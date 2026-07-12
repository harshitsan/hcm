import { useEffect, useState } from 'react'
import { ArrowSquareOut, Eye, EyeSlash, LockSimple } from 'phosphor-react'
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
import { RoleGate, useRole } from '@/context/role-context'
import {
  companyGroup,
  companyName,
  findSamePersonRecords,
  getGovernmentIds,
  getStatutory,
  LIFECYCLE_STAGES,
  maskGovernmentId,
  type Employee,
  type LifecycleStage,
  type ManagerChange,
} from '../data/employees'
import {
  getStatutoryFieldHints,
  STATUTORY_FIELD_LABELS,
} from '../data/statutory-requirements'
import { InfoField, SectionTitle, StatusBadge } from './shared'

interface EmployeeDetailSheetProps {
  employee: Employee | null
  open: boolean
  onOpenChange: (open: boolean) => void
  managerChanges: ManagerChange[]
  /** Directory scope — targets for the admin role-reassignment action. */
  employees: Employee[]
  /**
   * Full (unscoped) directory — used only to surface "also employed at"
   * cross-links for the same physical person in another company.
   */
  allEmployees?: Employee[]
  /** Opens another record's detail sheet (same-person cross-link). */
  onOpenRecord?: (employee: Employee) => void
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

/** Read-only field with a per-jurisdiction requirement hint underneath. */
function StatutoryField({
  label,
  value,
  hint,
}: {
  label: string
  value: React.ReactNode
  hint: string
}) {
  return (
    <div className='flex flex-col gap-0.5'>
      <span className='text-paragraph-sm text-neutral-1000'>{label}</span>
      <span className='text-neutral-1600 text-sm font-medium'>
        {value || '—'}
      </span>
      <span className='text-neutral-1000 text-xs'>{hint}</span>
    </div>
  )
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
  allEmployees,
  onOpenRecord,
  onRecordLifecycleEvent,
  onRunEngines,
  onLinkUserAccount,
  onReassignRoles,
  onInitiateSuspension,
}: EmployeeDetailSheetProps) {
  const { hasRole } = useRole()
  const [eventType, setEventType] = useState<LifecycleStage>('Probation')
  const [eventDate, setEventDate] = useState('')
  const [eventNote, setEventNote] = useState('')
  const [reassignOpen, setReassignOpen] = useState(false)
  const [reassignTarget, setReassignTarget] = useState('')
  const [suspendOpen, setSuspendOpen] = useState(false)
  const [suspendReason, setSuspendReason] = useState('')
  const [suspendFrom, setSuspendFrom] = useState('')
  const [suspendTo, setSuspendTo] = useState('')
  // Government IDs render masked; Company Admin can reveal them per record.
  const [showIds, setShowIds] = useState(false)
  useEffect(() => {
    setShowIds(false)
  }, [employee?.id])

  if (!employee) return null
  const audit = managerChanges.filter(
    (c) => c.employeeName === employee.name
  )
  const reassignTargets = employees.filter(
    (e) => e.id !== employee.id && e.lifecycleStage !== 'Exited'
  )
  // Same physical person (matching government IDs) in other companies —
  // separate records by design.
  const samePersonRecords = findSamePersonRecords(
    employee,
    allEmployees ?? employees
  )
  const governmentIds = getGovernmentIds(employee)
  const statutory = getStatutory(employee)
  const statutoryHints = getStatutoryFieldHints(employee.jurisdictionId)
  const renderId = (value?: string) =>
    !value ? '—' : showIds ? value : maskGovernmentId(value)

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
        <SheetHeader className='border-gray-200 border-b px-5 py-4'>
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
            <Badge variant={employee.hasUserAccount ? 'badge_active' : 'badge_inactive'}>
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
              {samePersonRecords.map((other) => (
                <div
                  key={other.id}
                  className='rounded-md border border-blue-200 bg-blue-50 px-3 py-2'
                >
                  <div className='flex items-center justify-between gap-2'>
                    <p className='text-sm font-medium'>
                      Also employed at {companyName(other.companyId)} (separate
                      record)
                    </p>
                    {onOpenRecord && (
                      <Button
                        variant='outline'
                        size='sm'
                        className='gap-1'
                        onClick={() => onOpenRecord(other)}
                      >
                        <ArrowSquareOut size={14} />
                        {other.code}
                      </Button>
                    )}
                  </div>
                  <p className='text-paragraph-sm text-neutral-1000 pt-1'>
                    Employee records are company-specific by design — the same
                    person employed by two companies has two separate records.
                    Changes to this record never affect {other.name}'s record
                    at {companyName(other.companyId)}.
                  </p>
                </div>
              ))}
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
              {employee.bulkFieldValues &&
                Object.keys(employee.bulkFieldValues).length > 0 && (
                  <>
                    <SectionTitle>Sub-record fields (mass update)</SectionTitle>
                    <div className='grid grid-cols-2 gap-4'>
                      {Object.entries(employee.bulkFieldValues).map(
                        ([field, value]) => (
                          <InfoField key={field} label={field} value={value} />
                        )
                      )}
                    </div>
                  </>
                )}

              <SectionTitle>Compensation</SectionTitle>
              <RoleGate
                roles={['Company Admin', 'Platform Admin']}
                fallback={
                  <div className='flex items-start gap-2 rounded-md border border-gray-200 bg-neutral-100 px-3 py-3'>
                    <LockSimple size={16} className='text-neutral-1000 mt-0.5' />
                    <div>
                      <p className='text-sm font-medium'>
                        Compensation details are restricted to HR
                        administrators.
                      </p>
                      <p className='text-paragraph-sm text-neutral-1000 pt-0.5'>
                        Phase 1 comp-dark policy: compensation visibility is
                        grantable only to HR Admin, Finance & Compliance
                        Viewer, or platform/portfolio roles (see Roles &
                        Security).
                      </p>
                    </div>
                  </div>
                }
              >
                {employee.compensation ? (
                  <>
                    <div className='grid grid-cols-2 gap-4'>
                      <InfoField
                        label='Annual CTC'
                        value={employee.compensation.annualCtc}
                      />
                      <InfoField
                        label='Fixed pay'
                        value={employee.compensation.fixedPay}
                      />
                      <InfoField
                        label='Variable pay'
                        value={employee.compensation.variablePay}
                      />
                      <InfoField
                        label='Last revised on'
                        value={employee.compensation.lastRevisedOn}
                      />
                    </div>
                    <p className='text-paragraph-sm text-neutral-1000'>
                      Comp-dark attributes — visible to HR administrators only
                      and excluded from non-admin exports. Captured for
                      reference; nothing is computed from these values.
                    </p>
                  </>
                ) : (
                  <p className='text-paragraph-sm text-neutral-1000'>
                    No compensation attributes captured on this record yet.
                  </p>
                )}
              </RoleGate>
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
              <div className='flex items-center justify-between'>
                <SectionTitle>Government IDs (dedup keys)</SectionTitle>
                <RoleGate roles={['Company Admin']}>
                  <Button
                    variant='outline'
                    size='sm'
                    className='gap-1'
                    onClick={() => setShowIds((v) => !v)}
                  >
                    {showIds ? <EyeSlash size={14} /> : <Eye size={14} />}
                    {showIds ? 'Hide' : 'Show'}
                  </Button>
                </RoleGate>
              </div>
              <div className='grid grid-cols-3 gap-4'>
                <InfoField
                  label='Aadhaar'
                  value={renderId(governmentIds.aadhaar)}
                />
                <InfoField label='PAN' value={renderId(governmentIds.pan)} />
                <InfoField
                  label='Passport'
                  value={renderId(governmentIds.passport)}
                />
              </div>
              <p className='text-paragraph-sm text-neutral-1000'>
                Shown masked — only the last 4 characters are visible.
                {hasRole('Company Admin')
                  ? ' Use Show to reveal the full values.'
                  : ' Full values can be revealed by the Company Admin only.'}{' '}
                Uniqueness is enforced on these IDs within a company; a match
                in another company is a valid separate record.
              </p>

              <SectionTitle>Statutory workforce data</SectionTitle>
              <p className='text-paragraph-sm text-neutral-1000'>
                Which fields are required comes from the jurisdiction's
                statutory profile ({employee.jurisdiction}) — captured for
                reference only, nothing is computed here.
              </p>
              <div className='grid grid-cols-2 gap-4'>
                <StatutoryField
                  label={STATUTORY_FIELD_LABELS.uan}
                  value={statutory.uan}
                  hint={statutoryHints.uan.hint}
                />
                <StatutoryField
                  label={STATUTORY_FIELD_LABELS.esicNumber}
                  value={statutory.esicNumber}
                  hint={statutoryHints.esicNumber.hint}
                />
                <StatutoryField
                  label={STATUTORY_FIELD_LABELS.pfEligible}
                  value={statutory.pfEligible ? 'Eligible' : 'Not eligible'}
                  hint={statutoryHints.pfEligible.hint}
                />
                <StatutoryField
                  label={STATUTORY_FIELD_LABELS.esiEligible}
                  value={statutory.esiEligible ? 'Eligible' : 'Not eligible'}
                  hint={statutoryHints.esiEligible.hint}
                />
                <StatutoryField
                  label={STATUTORY_FIELD_LABELS.ptRegistration}
                  value={statutory.ptRegistration}
                  hint={statutoryHints.ptRegistration.hint}
                />
                <StatutoryField
                  label={STATUTORY_FIELD_LABELS.lwfApplicable}
                  value={statutory.lwfApplicable ? 'Applicable' : 'Not applicable'}
                  hint={statutoryHints.lwfApplicable.hint}
                />
                <StatutoryField
                  label={STATUTORY_FIELD_LABELS.maternityEligible}
                  value={statutory.maternityEligible ? 'Eligible' : 'Not eligible'}
                  hint={statutoryHints.maternityEligible.hint}
                />
                <StatutoryField
                  label={STATUTORY_FIELD_LABELS.gratuityEligible}
                  value={statutory.gratuityEligible ? 'Eligible' : 'Not eligible'}
                  hint={statutoryHints.gratuityEligible.hint}
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
              <SectionTitle>Leave balances & statutory entitlements</SectionTitle>
              <ul className='space-y-1.5'>
                {employee.leaveBalances.map((b) => (
                  <li
                    key={b.type}
                    className='flex items-center justify-between rounded-md border border-gray-200 px-3 py-1.5 text-sm'
                  >
                    <span className='font-medium'>{b.type}</span>
                    <span className='text-neutral-1000'>
                      {b.balance} of {b.statutoryEntitlement} days — statutory
                      minimum {b.statutoryEntitlement}/yr
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
