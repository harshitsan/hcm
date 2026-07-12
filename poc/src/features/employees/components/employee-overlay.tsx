import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { Button } from '@/components/ui/button'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
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
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { ROLES, useRole } from '@/context/role-context'
import { publishAuditEvent } from '@/features/audit-logs/data/live-trail'
import {
  formatEmployeeCode,
  getEmployeeCodeSeries,
} from '../data/configuration'
import {
  COMPANIES,
  DEPARTMENTS,
  EMPLOYEE_CLASSES,
  EMPLOYEE_GROUPS,
  GENDERS,
  JURISDICTIONS,
  LOCATIONS,
  POSITION_LEVELS,
  POSITIONS,
  type Employee,
} from '../data/employees'
import {
  getStatutoryFieldHints,
  JURISDICTION_LABEL_TO_ID,
} from '../data/statutory-requirements'
import { type DedupClassification, type EmployeeDraft } from '../hooks/use-employees'
import { MultiToggle, SectionTitle } from './shared'

const employeeFormSchema = z
  .object({
    name: z.string().min(2, 'Employee name is required'),
    code: z.string(),
    email: z.string(),
    gender: z.enum(GENDERS, 'Gender is required'),
    socialMediaLinkedIn: z.string(),
    socialMediaTwitter: z.string(),
    hasUserAccount: z.boolean(),
    companyId: z.string().min(1, 'Exactly one company is mandatory'),
    jurisdiction: z.enum(JURISDICTIONS, 'Jurisdiction is mandatory'),
    departments: z
      .array(z.string())
      .min(1, 'At least one department is mandatory'),
    position: z.string().min(1, 'Exactly one position is mandatory'),
    positionLevel: z.string().min(1, 'Position level is required'),
    functionalLocation: z.string().min(1, 'Functional location is required'),
    roles: z.array(z.string()),
    groups: z.array(z.string()),
    locations: z.array(z.string()),
    employeeClass: z.enum(EMPLOYEE_CLASSES),
    attendanceTracked: z.boolean(),
    abscondingAlertsEnabled: z.boolean(),
    supervisorApprovalRequired: z.boolean(),
    primaryManager: z
      .string()
      .min(1, 'A single primary manager is required'),
    dottedLineManagers: z.array(z.string()),
    managerEffectiveDate: z
      .string()
      .min(1, 'Manager changes require an effective date'),
    joinDate: z.string().min(1, 'Date of joining is required'),
    aadhar: z.string(),
    pan: z.string(),
    passport: z.string(),
    uan: z.string(),
    esicNumber: z.string(),
    ptRegistered: z.boolean(),
    ptRegistration: z.string(),
    lwfApplicable: z.boolean(),
    pfEligible: z.boolean(),
    esiEligible: z.boolean(),
    annualCtc: z.string(),
    fixedPay: z.string(),
    variablePay: z.string(),
    lastRevisedOn: z.string(),
  })
  .refine((v) => !v.hasUserAccount || v.email.length > 3, {
    message: 'A linked user account needs an email',
    path: ['email'],
  })

type EmployeeFormValues = z.infer<typeof employeeFormSchema>

const emptyDraft: EmployeeFormValues = {
  name: '',
  code: '',
  email: '',
  gender: 'Male',
  socialMediaLinkedIn: '',
  socialMediaTwitter: '',
  hasUserAccount: false,
  companyId: '',
  jurisdiction: 'India — Karnataka',
  departments: [],
  position: '',
  positionLevel: '',
  functionalLocation: '',
  roles: ['Employee (User)'],
  groups: [],
  locations: [],
  employeeClass: 'Probationer',
  attendanceTracked: true,
  abscondingAlertsEnabled: true,
  supervisorApprovalRequired: false,
  primaryManager: '',
  dottedLineManagers: [],
  managerEffectiveDate: '',
  joinDate: '',
  aadhar: '',
  pan: '',
  passport: '',
  uan: '',
  esicNumber: '',
  ptRegistered: false,
  ptRegistration: '',
  lwfApplicable: false,
  pfEligible: false,
  esiEligible: false,
  annualCtc: '',
  fixedPay: '',
  variablePay: '',
  lastRevisedOn: '',
}

interface EmployeeOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee?: Employee | null
  managerOptions: string[]
  /** Rules-engine dedup check (EMP-10/25) run before the record is saved. */
  classify: (
    draft: Pick<EmployeeDraft, 'aadhar' | 'pan' | 'passport' | 'companyId'>,
    excludeId?: string
  ) => DedupClassification
  onSubmit: (draft: EmployeeDraft) => void
}

export function EmployeeOverlay({
  open,
  onOpenChange,
  employee,
  managerOptions,
  classify,
  onSubmit,
}: EmployeeOverlayProps) {
  const isEdit = Boolean(employee)
  const { role } = useRole()
  // Employee code series (governed config) — determines whether the code is
  // auto-generated on create or manually entered here.
  const codeSeries = getEmployeeCodeSeries()
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: emptyDraft,
  })
  // Separate-company government-ID match held here until the informational
  // dedup prompt is confirmed or cancelled.
  const [pendingDedup, setPendingDedup] = useState<{
    values: EmployeeFormValues
    match: Extract<DedupClassification, { kind: 'separate-company' }>
  } | null>(null)

  useEffect(() => {
    if (!open) return
    form.reset(
      employee
        ? {
            ...emptyDraft,
            ...employee,
            ptRegistration: employee.statutory?.ptRegistration ?? '',
            pfEligible:
              employee.statutory?.pfEligible ??
              employee.esiPfEligibility === 'Eligible',
            esiEligible:
              employee.statutory?.esiEligible ??
              (employee.esiPfEligibility === 'Eligible' &&
                Boolean(employee.esicNumber)),
            annualCtc: employee.compensation?.annualCtc ?? '',
            fixedPay: employee.compensation?.fixedPay ?? '',
            variablePay: employee.compensation?.variablePay ?? '',
            lastRevisedOn: employee.compensation?.lastRevisedOn ?? '',
          }
        : emptyDraft
    )
  }, [open, employee, form])

  /** Builds the record draft (incl. the nested W1 blocks) and saves it. */
  function finalizeSubmit(values: EmployeeFormValues) {
    const hasCompensation =
      values.annualCtc ||
      values.fixedPay ||
      values.variablePay ||
      values.lastRevisedOn
    onSubmit({
      ...values,
      jurisdictionId:
        JURISDICTION_LABEL_TO_ID[values.jurisdiction] ??
        employee?.jurisdictionId,
      lifecycleStage: employee?.lifecycleStage ?? 'Onboarding',
      governmentIds: {
        aadhaar: values.aadhar || undefined,
        pan: values.pan || undefined,
        passport: values.passport || undefined,
      },
      statutory: {
        uan: values.uan || undefined,
        esicNumber: values.esicNumber || undefined,
        pfEligible: values.pfEligible,
        esiEligible: values.esiEligible,
        ptRegistration: values.ptRegistration || undefined,
        lwfApplicable: values.lwfApplicable,
        maternityEligible: employee?.statutory?.maternityEligible ?? false,
        gratuityEligible: employee?.statutory?.gratuityEligible ?? false,
      },
      compensation: hasCompensation
        ? {
            annualCtc: values.annualCtc || undefined,
            fixedPay: values.fixedPay || undefined,
            variablePay: values.variablePay || undefined,
            lastRevisedOn: values.lastRevisedOn || undefined,
          }
        : employee?.compensation,
    })
    onOpenChange(false)
  }

  function handleSubmit(values: EmployeeFormValues) {
    if (!isEdit && !codeSeries.autoGenerate && !values.code.trim()) {
      form.setError('code', {
        message:
          'Employee code is required — auto-generation is off in configuration',
      })
      return
    }
    // Duplicate-detection decision table (EMP-10 / EMP-25): a same-company
    // government-ID hit blocks the save on the conflicting field; a hit in
    // another company is a valid, independent record after an informational
    // confirmation. Both outcomes are written to the audit trail.
    const result = classify(values, employee?.id)
    if (result.kind === 'same-company') {
      const fieldName =
        result.field === 'Aadhaar'
          ? 'aadhar'
          : result.field === 'PAN'
            ? 'pan'
            : 'passport'
      form.setError(fieldName, {
        message: `An employee record with this ${result.field} already exists in ${result.company} — duplicate records within a company are not allowed (matches ${result.existingName}, ${result.existingCode}).`,
      })
      publishAuditEvent({
        module: 'Employee Management',
        action: 'Duplicate employee record blocked',
        actor: 'You',
        actorRole: role,
        actionType: 'update',
        recordId: employee?.code ?? '—',
        recordName: values.name || 'New employee',
        changes: [
          {
            field: `${result.field} duplicate check`,
            previousValue: null,
            newValue: `Blocked — matches ${result.existingName} (${result.existingCode}) in ${result.company}`,
          },
        ],
      })
      toast.error(
        `An employee record with this ${result.field} already exists in ${result.company} — duplicate records within a company are not allowed`
      )
      return
    }
    if (result.kind === 'separate-company') {
      setPendingDedup({ values, match: result })
      return
    }
    finalizeSubmit(values)
  }

  /** Separate-company match confirmed — audit the override, then save. */
  function confirmSeparateCompany() {
    if (!pendingDedup) return
    const { values, match } = pendingDedup
    publishAuditEvent({
      module: 'Employee Management',
      action: 'Separate-company ID match confirmed',
      actor: 'You',
      actorRole: role,
      actionType: 'update',
      recordId: employee?.code ?? '—',
      recordName: values.name || 'New employee',
      changes: [
        {
          field: `${match.field} duplicate check`,
          previousValue: null,
          newValue: `Allowed — matches ${match.existingName} (${match.existingCode}) at ${match.company}; records are company-specific by design`,
        },
      ],
    })
    toast.info(
      `${match.field} matches ${match.existingName} at ${match.company} — saved as a separate company-specific record`
    )
    setPendingDedup(null)
    finalizeSubmit(values)
  }

  // Per-jurisdiction statutory requirements, derived read-only from the
  // jurisdictions catalog for the currently selected jurisdiction.
  const statutoryHints = getStatutoryFieldHints(
    JURISDICTION_LABEL_TO_ID[form.watch('jurisdiction')]
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[560px]'>
        <SheetHeader className='border-gray-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            {isEdit ? `Edit employee — ${employee?.code}` : 'New employee'}
          </SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className='flex min-h-0 flex-1 flex-col'
          >
            <div className='flex-1 space-y-5 overflow-y-auto px-5 py-5'>
              <SectionTitle>Identity & system access</SectionTitle>
              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full name</FormLabel>
                      <FormControl>
                        <Input placeholder='e.g. Asha Rao' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='joinDate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of joining</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='gender'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger variant='secondary' className='w-full'>
                            <SelectValue placeholder='Select gender' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {GENDERS.map((g) => (
                            <SelectItem key={g} value={g}>
                              {g}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {!isEdit && !codeSeries.autoGenerate && (
                  <FormField
                    control={form.control}
                    name='code'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employee code (manual)</FormLabel>
                        <FormControl>
                          <Input placeholder='e.g. AUR-0350' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
              {!isEdit && codeSeries.autoGenerate && (
                <p className='text-paragraph-sm text-neutral-1000 rounded-md border border-gray-200 px-3 py-2'>
                  Employee code will be auto-generated from the configured
                  series:{' '}
                  <span className='text-neutral-1600 font-medium'>
                    {formatEmployeeCode(codeSeries)}
                  </span>
                </p>
              )}
              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='socialMediaLinkedIn'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LinkedIn (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='https://linkedin.com/in/…'
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='socialMediaTwitter'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Twitter / X (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder='https://x.com/…' {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name='hasUserAccount'
                render={({ field }) => (
                  <FormItem className='flex items-center justify-between rounded-md border border-gray-200 px-3 py-2'>
                    <div>
                      <FormLabel>Link a user account</FormLabel>
                      <p className='text-paragraph-sm text-neutral-1000'>
                        Off = staff without system access; the record stays
                        fully maintained either way.
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              {form.watch('hasUserAccount') && (
                <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work email (user account)</FormLabel>
                      <FormControl>
                        <Input placeholder='e.g. asha@company.in' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <SectionTitle>Organizational assignments</SectionTitle>
              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='companyId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company (exactly one)</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isEdit}
                      >
                        <FormControl>
                          <SelectTrigger variant='secondary' className='w-full'>
                            <SelectValue placeholder='Select company' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {COMPANIES.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
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
                  name='jurisdiction'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jurisdiction</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger variant='secondary' className='w-full'>
                            <SelectValue placeholder='Select jurisdiction' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {JURISDICTIONS.map((j) => (
                            <SelectItem key={j} value={j}>
                              {j}
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
                  name='position'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position (exactly one)</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger variant='secondary' className='w-full'>
                            <SelectValue placeholder='Select position' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {POSITIONS.map((p) => (
                            <SelectItem key={p} value={p}>
                              {p}
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
                  name='employeeClass'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee class</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger variant='secondary' className='w-full'>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {EMPLOYEE_CLASSES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
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
                  name='positionLevel'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position level</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger variant='secondary' className='w-full'>
                            <SelectValue placeholder='Select level' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {POSITION_LEVELS.map((l) => (
                            <SelectItem key={l} value={l}>
                              {l}
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
                  name='functionalLocation'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Functional location</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger variant='secondary' className='w-full'>
                            <SelectValue placeholder='Select location' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {LOCATIONS.map((l) => (
                            <SelectItem key={l} value={l}>
                              {l}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name='roles'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Roles (multi-assign from canonical list)</FormLabel>
                    <FormControl>
                      <MultiToggle
                        options={ROLES}
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='departments'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departments (at least one, multiple allowed)</FormLabel>
                    <FormControl>
                      <MultiToggle
                        options={DEPARTMENTS}
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='groups'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Groups (optional)</FormLabel>
                    <FormControl>
                      <MultiToggle
                        options={EMPLOYEE_GROUPS}
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='locations'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operating locations (optional, multiple allowed)</FormLabel>
                    <FormControl>
                      <MultiToggle
                        options={LOCATIONS}
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <SectionTitle>Reporting structure</SectionTitle>
              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='primaryManager'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary manager (exactly one)</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger variant='secondary' className='w-full'>
                            <SelectValue placeholder='Select manager' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {managerOptions.map((m) => (
                            <SelectItem key={m} value={m}>
                              {m}
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
                  name='managerEffectiveDate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Effective date (required)</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name='dottedLineManagers'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dotted-line managers (optional)</FormLabel>
                    <FormControl>
                      <MultiToggle
                        options={managerOptions.filter(
                          (m) => m !== form.watch('primaryManager')
                        )}
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <SectionTitle>Tracking & approvals</SectionTitle>
              {(
                [
                  [
                    'attendanceTracked',
                    'Attendance tracked',
                    'Include this employee in attendance capture and reports.',
                  ],
                  [
                    'abscondingAlertsEnabled',
                    'Absconding alerts',
                    'Alert HR when the employee is absent without intimation.',
                  ],
                  [
                    'supervisorApprovalRequired',
                    'Supervisor approval required',
                    'Self-service changes route to the supervisor for approval.',
                  ],
                ] as const
              ).map(([name, label, hint]) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field }) => (
                    <FormItem className='flex items-center justify-between rounded-md border border-gray-200 px-3 py-2'>
                      <div>
                        <FormLabel>{label}</FormLabel>
                        <p className='text-paragraph-sm text-neutral-1000'>
                          {hint}
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              ))}

              <SectionTitle>Government IDs & statutory data</SectionTitle>
              <p className='text-paragraph-sm text-neutral-1000'>
                Government IDs are the duplicate-detection keys: the same ID
                twice in one company is blocked; a match in another company is
                allowed after confirmation (records are company-specific).
              </p>
              <div className='grid grid-cols-2 gap-4'>
                {(
                  [
                    ['aadhar', 'Aadhaar', 'e.g. 2345 6789 4821'],
                    ['pan', 'PAN', 'e.g. ABCPE1234F'],
                    ['passport', 'Passport', 'e.g. N1234567'],
                    ['uan', 'UAN', 'e.g. 100845221101'],
                    ['esicNumber', 'ESIC number', 'e.g. 3100224466'],
                  ] as const
                ).map(([name, label, placeholder]) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{label}</FormLabel>
                        <FormControl>
                          <Input placeholder={placeholder} {...field} />
                        </FormControl>
                        {name === 'uan' && (
                          <p className='text-neutral-1000 text-xs'>
                            {statutoryHints.uan.hint}
                          </p>
                        )}
                        {name === 'esicNumber' && (
                          <p className='text-neutral-1000 text-xs'>
                            {statutoryHints.esicNumber.hint}
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
                <FormField
                  control={form.control}
                  name='ptRegistration'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PT registration number</FormLabel>
                      <FormControl>
                        <Input placeholder='e.g. PTR-KA-2026-0125' {...field} />
                      </FormControl>
                      <p className='text-neutral-1000 text-xs'>
                        {statutoryHints.ptRegistration.hint}
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='pfEligible'
                  render={({ field }) => (
                    <FormItem className='flex items-center justify-between rounded-md border border-gray-200 px-3 py-2'>
                      <FormLabel>Provident Fund eligible</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='esiEligible'
                  render={({ field }) => (
                    <FormItem className='flex items-center justify-between rounded-md border border-gray-200 px-3 py-2'>
                      <FormLabel>ESI eligible</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='ptRegistered'
                  render={({ field }) => (
                    <FormItem className='flex items-center justify-between rounded-md border border-gray-200 px-3 py-2'>
                      <FormLabel>Professional Tax registered</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='lwfApplicable'
                  render={({ field }) => (
                    <FormItem className='flex items-center justify-between rounded-md border border-gray-200 px-3 py-2'>
                      <FormLabel>LWF applicable</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <p className='text-paragraph-sm text-neutral-1000'>
                Labour Welfare Fund: {statutoryHints.lwfApplicable.hint}.
                Maternity and gratuity eligibility are determined by the Rules
                engine from the jurisdiction rule-pack after save — statutory
                data is captured for reference only, nothing is computed.
              </p>

              <SectionTitle>Compensation (restricted)</SectionTitle>
              <p className='text-paragraph-sm text-neutral-1000'>
                Comp-dark: these values are shown only to HR administrators on
                the record. Captured for reference — never computed.
              </p>
              <div className='grid grid-cols-2 gap-4'>
                {(
                  [
                    ['annualCtc', 'Annual CTC', 'e.g. ₹12,00,000'],
                    ['fixedPay', 'Fixed pay', 'e.g. ₹10,80,000'],
                    ['variablePay', 'Variable pay', 'e.g. ₹1,20,000'],
                  ] as const
                ).map(([name, label, placeholder]) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{label}</FormLabel>
                        <FormControl>
                          <Input placeholder={placeholder} {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                ))}
                <FormField
                  control={form.control}
                  name='lastRevisedOn'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last revised on</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className='border-gray-200 flex items-center justify-end gap-3 border-t px-5 py-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type='submit'>
                {isEdit ? 'Save changes' : 'Create employee'}
              </Button>
            </div>
          </form>
        </Form>

        {/* Informational dedup prompt — separate-company government-ID match. */}
        <ConfirmDialog
          open={pendingDedup !== null}
          onOpenChange={(dialogOpen) => {
            if (!dialogOpen) setPendingDedup(null)
          }}
          title='Same ID found in another company'
          desc={
            pendingDedup
              ? `This ${pendingDedup.match.field} matches ${pendingDedup.match.existingName} (${pendingDedup.match.existingCode}) at ${pendingDedup.match.company}. The same person may hold separate records in different companies — employee records are company-specific by design. Continue?`
              : ''
          }
          confirmText='Continue — separate record'
          handleConfirm={confirmSeparateCompany}
        />
      </FloatingSheetContent>
    </Sheet>
  )
}
