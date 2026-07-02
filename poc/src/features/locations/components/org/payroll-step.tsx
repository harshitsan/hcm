import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  MONTHS,
  PAYROLL_OCCURRENCES,
  PAYROLL_PERIODS,
} from '../../data/organization'
import type { OrganizationStore } from '../../hooks/use-organization'
import type { StepNavProps } from '../organization-tab'

const payrollSchema = z.object({
  fyStartMonth: z.enum(MONTHS),
  payrollPeriod: z.enum(PAYROLL_PERIODS),
  payrollOccurrence: z.enum(PAYROLL_OCCURRENCES),
  shiftOnHoliday: z.boolean(),
})

type PayrollValues = z.infer<typeof payrollSchema>

interface PayrollStepProps extends StepNavProps {
  org: OrganizationStore
}

/** Organization-wide payroll schedule + holiday shifting (LOC-20, LOC-21). */
export function PayrollStep({ org, onNext, onBack }: PayrollStepProps) {
  const form = useForm<PayrollValues>({
    resolver: zodResolver(payrollSchema),
    defaultValues: org.payroll,
  })

  function handleSubmit(values: PayrollValues) {
    org.savePayroll(values)
    onNext()
  }

  const shiftEnabled = form.watch('shiftOnHoliday')

  return (
    <Card className='gap-2 border-none bg-white py-3'>
      <CardHeader className='px-4'>
        <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
          Payroll schedule
        </CardTitle>
      </CardHeader>
      <CardContent className='px-4'>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className='max-w-2xl space-y-4'>
            <FormField
              control={form.control}
              name='fyStartMonth'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Financial year starts from</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger variant='secondary' className='w-full'>
                        <SelectValue placeholder='Select a month' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MONTHS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Changing the start month re-bases subsequent payroll and
                    reporting periods.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-2 gap-3'>
              <FormField
                control={form.control}
                name='payrollPeriod'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payroll period</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PAYROLL_PERIODS.map((p) => (
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
                name='payrollOccurrence'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payroll to occur</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PAYROLL_OCCURRENCES.map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
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
              name='shiftOnHoliday'
              render={({ field }) => (
                <FormItem className='rounded-[6px] border border-gray-200 p-3'>
                  <div className='flex items-center justify-between'>
                    <FormLabel className='font-medium'>
                      Change the payroll date if it occurs on a holiday or weekoff?
                    </FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </div>
                  <FormDescription>
                    {shiftEnabled
                      ? 'Enabled — a payroll date landing on a holiday or weekoff moves to the nearest working day.'
                      : 'Disabled — the payroll date is left unchanged even on holidays and weekoffs.'}
                  </FormDescription>
                </FormItem>
              )}
            />

            <div className='flex justify-end gap-3 pt-2'>
              <Button type='button' variant='outline' onClick={onBack}>
                Back
              </Button>
              <Button type='submit'>Save &amp; Next</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
