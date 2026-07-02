import { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
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
import {
  COMPANIES,
  DEPARTMENTS,
  EMPLOYEE_CLASSES,
  EMPLOYEE_GROUPS,
  JURISDICTIONS,
  LOCATIONS,
  POSITIONS,
  type Employee,
} from '../data/employees'
import { type DedupClassification, type EmployeeDraft } from '../hooks/use-employees'
import { MultiToggle, SectionTitle } from './shared'

const employeeFormSchema = z
  .object({
    name: z.string().min(2, 'Employee name is required'),
    email: z.string(),
    hasUserAccount: z.boolean(),
    companyId: z.string().min(1, 'Exactly one company is mandatory'),
    jurisdiction: z.enum(JURISDICTIONS, 'Jurisdiction is mandatory'),
    departments: z
      .array(z.string())
      .min(1, 'At least one department is mandatory'),
    position: z.string().min(1, 'Exactly one position is mandatory'),
    groups: z.array(z.string()),
    locations: z.array(z.string()),
    employeeClass: z.enum(EMPLOYEE_CLASSES),
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
    lwfApplicable: z.boolean(),
  })
  .refine((v) => !v.hasUserAccount || v.email.length > 3, {
    message: 'A linked user account needs an email',
    path: ['email'],
  })

type EmployeeFormValues = z.infer<typeof employeeFormSchema>

const emptyDraft: EmployeeFormValues = {
  name: '',
  email: '',
  hasUserAccount: false,
  companyId: '',
  jurisdiction: 'India — Karnataka',
  departments: [],
  position: '',
  groups: [],
  locations: [],
  employeeClass: 'Probationer',
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
  lwfApplicable: false,
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
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: emptyDraft,
  })

  useEffect(() => {
    if (!open) return
    form.reset(employee ? { ...emptyDraft, ...employee } : emptyDraft)
  }, [open, employee, form])

  function handleSubmit(values: EmployeeFormValues) {
    // Duplicate-detection decision table (EMP-10 / EMP-25): same-company hit
    // blocks the save on the specific conflicting field; a hit in another
    // company is a valid, independent record.
    const result = classify(values, employee?.id)
    if (result.kind === 'same-company') {
      const fieldName =
        result.field === 'Aadhar'
          ? 'aadhar'
          : result.field === 'PAN'
            ? 'pan'
            : 'passport'
      form.setError(fieldName, {
        message: `${result.field} already exists on ${result.existing}. Resolve the duplicate to continue.`,
      })
      toast.error(
        `Same-company duplicate blocked — ${result.field} collides with ${result.existing}`
      )
      return
    }
    if (result.kind === 'separate-company') {
      toast.info(
        `${result.field} matches ${result.existing} — allowed as a separate-company record per dedup config`
      )
    }
    onSubmit({
      ...values,
      lifecycleStage: employee?.lifecycleStage ?? 'Onboarding',
    })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[560px]'>
        <SheetHeader className='border-grey-200 border-b px-5 py-4'>
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
                        <Input placeholder='Asha Rao' {...field} />
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
                        <Input placeholder='name@company.in' {...field} />
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
              </div>
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

              <SectionTitle>Government IDs & statutory data</SectionTitle>
              <div className='grid grid-cols-2 gap-4'>
                {(
                  [
                    ['aadhar', 'Aadhar', '0000-0000-0000'],
                    ['pan', 'PAN', 'ABCDE1234F'],
                    ['passport', 'Passport', 'N1234567'],
                    ['uan', 'UAN', '12 digits'],
                    ['esicNumber', 'ESIC number', '10 digits'],
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <div className='grid grid-cols-2 gap-4'>
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
                ESI/PF, maternity and gratuity eligibility are determined
                automatically by the Rules engine from the jurisdiction
                rule-pack after save.
              </p>
            </div>

            <div className='border-grey-200 flex items-center justify-end gap-3 border-t px-5 py-4'>
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
      </FloatingSheetContent>
    </Sheet>
  )
}
