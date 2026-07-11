import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PencilSimple, Plus } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import {
  CLASS_TYPES,
  PAYROLL_FREQUENCIES,
  WAGE_TYPES,
  type EmployeeClass,
} from '../../data/org-config'
import type { OrgConfigStore } from '../../hooks/use-org-config'
import { StatusBadge, WageTypeBadge } from '../badges'

// Frequency and wage type are both mandatory so payroll can run (POS-31/38).
const classSchema = z.object({
  name: z.string().min(2, 'Class name is required'),
  acronym: z
    .string()
    .min(1, 'Acronym is required')
    .max(5, 'Keep the acronym to 5 characters'),
  classType: z.enum(CLASS_TYPES),
  payrollFrequency: z.enum(PAYROLL_FREQUENCIES, 'Payroll frequency is required'),
  wageType: z.enum(WAGE_TYPES, 'Wage type is required before the class can be used'),
})

type ClassFormValues = z.infer<typeof classSchema>

type StatusFilter = 'all' | 'active' | 'inactive'

interface ClassificationsPanelProps {
  companyId: string
  orgConfig: OrgConfigStore
}

/**
 * Employee classifications (POS-29/30/31/32/38/39): class type drives payroll
 * frequency (which pay run includes members) and wage type (Hourly ⇒
 * overtime-eligible, Salaried ⇒ exempt), with an Active/Inactive filter.
 */
export function ClassificationsPanel({
  companyId,
  orgConfig,
}: ClassificationsPanelProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<EmployeeClass | null>(null)

  const scoped = orgConfig.employeeClasses.filter(
    (c) => c.companyId === companyId
  )
  const rows =
    statusFilter === 'all'
      ? scoped
      : scoped.filter((c) => c.status === statusFilter)

  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      name: '',
      acronym: '',
      classType: 'Full time',
      payrollFrequency: 'Monthly',
      wageType: 'Salaried',
    },
  })

  const openDialog = (cls: EmployeeClass | null) => {
    setEditing(cls)
    form.reset(
      cls
        ? {
            name: cls.name,
            acronym: cls.acronym,
            classType: cls.classType,
            payrollFrequency: cls.payrollFrequency,
            wageType: cls.wageType,
          }
        : {
            name: '',
            acronym: '',
            classType: 'Full time',
            payrollFrequency: 'Monthly',
            wageType: 'Salaried',
          }
    )
    setDialogOpen(true)
  }

  const handleSubmit = (values: ClassFormValues) => {
    const acronym = values.acronym.toUpperCase()
    // Duplicate acronyms are flagged so they remain unique (POS-29).
    const duplicate = scoped.some(
      (c) => c.id !== editing?.id && c.acronym === acronym
    )
    if (duplicate) {
      form.setError('acronym', {
        message: `Acronym ${acronym} is already used by another class`,
      })
      return
    }
    const draft = {
      ...values,
      acronym,
      companyId,
      status: editing?.status ?? ('active' as const),
    }
    if (editing) {
      orgConfig.updateEmployeeClass(editing.id, draft)
    } else {
      orgConfig.addEmployeeClass(draft)
    }
    setDialogOpen(false)
    setEditing(null)
  }

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        >
          <SelectTrigger variant='secondary' className='h-8 w-[180px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All statuses</SelectItem>
            <SelectItem value='active'>Active only</SelectItem>
            <SelectItem value='inactive'>Inactive only</SelectItem>
          </SelectContent>
        </Select>
        <Button className='h-8' onClick={() => openDialog(null)}>
          <Plus size={12} weight='bold' />
          New employee class
        </Button>
      </div>

      <div className='divide-grey-200 border-gray-200 divide-y rounded-[6px] border'>
        {rows.length === 0 && (
          <p className='text-paragraph-sm text-neutral-1000 px-3 py-3'>
            No classes with this status.
          </p>
        )}
        {rows.map((c) => (
          <div key={c.id} className='flex items-center justify-between gap-2 px-3 py-2'>
            <div className='flex min-w-0 flex-col gap-1'>
              <div className='flex items-center gap-2'>
                <span className='text-neutral-1600 text-sm font-medium'>
                  {c.name}
                </span>
                <Badge variant='open'>{c.acronym}</Badge>
                <StatusBadge status={c.status} />
              </div>
              <div className='flex flex-wrap items-center gap-2'>
                <span className='text-paragraph-sm text-neutral-1000'>
                  {c.classType} · {c.payrollFrequency} pay run
                </span>
                <WageTypeBadge wageType={c.wageType} />
              </div>
            </div>
            <div className='flex items-center gap-1'>
              <Button
                variant='outline'
                className='h-7'
                onClick={() =>
                  orgConfig.setClassStatus(
                    c.id,
                    c.status === 'active' ? 'inactive' : 'active'
                  )
                }
              >
                {c.status === 'active' ? 'Set inactive' : 'Reactivate'}
              </Button>
              <Button
                variant='icon2'
                className='text-neutral-1900 h-7 w-7'
                aria-label={`Edit ${c.name}`}
                onClick={() => openDialog(c)}
              >
                <PencilSimple size={14} weight='fill' />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='sm:max-w-[440px]'>
          <DialogHeader>
            <DialogTitle>
              {editing ? `Edit ${editing.name}` : 'New employee class'}
            </DialogTitle>
            <DialogDescription>
              Payroll frequency decides which pay run includes members; wage
              type decides overtime eligibility. Both are required.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-3'>
              <div className='grid grid-cols-2 gap-2'>
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class name</FormLabel>
                      <FormControl>
                        <Input placeholder='e.g. Contract_Monthly' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='acronym'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Acronym</FormLabel>
                      <FormControl>
                        <Input placeholder='e.g. CM' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {(
                [
                  { name: 'classType', label: 'Class type', options: CLASS_TYPES },
                  {
                    name: 'payrollFrequency',
                    label: 'Payroll frequency',
                    options: PAYROLL_FREQUENCIES,
                  },
                  { name: 'wageType', label: 'Wage type', options: WAGE_TYPES },
                ] as const
              ).map((f) => (
                <FormField
                  key={f.name}
                  control={form.control}
                  name={f.name}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{f.label}</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger variant='secondary' className='w-full'>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {f.options.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type='submit'>
                  {editing ? 'Save class' : 'Create class'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
