import { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { DELEGATABLE_ACTIVITIES } from '../data/delegations'
import { CURRENT_EMPLOYEE_ID, PEOPLE, companyName } from '../data/directory'
import { type DelegationDraft } from '../hooks/use-delegations'

const delegationSchema = z
  .object({
    delegateId: z.string().min(1, 'Select a delegate'),
    activities: z
      .array(z.enum(DELEGATABLE_ACTIVITIES))
      .min(1, 'Choose at least one activity to delegate'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string(),
  })
  .refine((v) => !v.endDate || v.endDate >= v.startDate, {
    message: 'End date must be on or after the start date',
    path: ['endDate'],
  })

type DelegationValues = z.infer<typeof delegationSchema>

const emptyValues: DelegationValues = {
  delegateId: '',
  activities: [],
  startDate: new Date().toISOString().slice(0, 10),
  endDate: '',
}

interface DelegationOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (draft: DelegationDraft) => boolean
}

/**
 * New delegation (RSEC-04). All users are listed — picking one from another
 * company demonstrates the same-company rejection on save.
 */
export function DelegationOverlay({
  open,
  onOpenChange,
  onSubmit,
}: DelegationOverlayProps) {
  const form = useForm<DelegationValues>({
    resolver: zodResolver(delegationSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) form.reset(emptyValues)
  }, [open, form])

  const candidates = PEOPLE.filter(
    (p) => p.isUser && p.id !== CURRENT_EMPLOYEE_ID
  )

  function handleSubmit(values: DelegationValues) {
    const ok = onSubmit({
      ownerId: CURRENT_EMPLOYEE_ID,
      delegateId: values.delegateId,
      activities: values.activities,
      startDate: values.startDate,
      endDate: values.endDate || null,
    })
    if (ok) onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[440px]'>
        <SheetHeader className='border-gray-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            Delegate my activities
          </SheetTitle>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className='flex min-h-0 flex-1 flex-col'
          >
            <div className='flex-1 space-y-4 overflow-y-auto px-5 py-5'>
              <FormField
                control={form.control}
                name='delegateId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Delegate (must be in your company — others are rejected)
                    </FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue placeholder='Select delegate' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {candidates.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} · {companyName(p.companyId)}
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
                name='activities'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Activities to delegate</FormLabel>
                    <div className='grid grid-cols-1 gap-2 rounded-[6px] border border-gray-200 p-3'>
                      {DELEGATABLE_ACTIVITIES.map((a) => (
                        <label key={a} className='flex items-center gap-2 text-sm'>
                          <Checkbox
                            variant='blue'
                            checked={field.value.includes(a)}
                            onCheckedChange={(checked) =>
                              field.onChange(
                                checked
                                  ? [...field.value, a]
                                  : field.value.filter((x) => x !== a)
                              )
                            }
                          />
                          {a}
                        </label>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className='grid grid-cols-2 gap-3'>
                <FormField
                  control={form.control}
                  name='startDate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Starts</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='endDate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ends (optional)</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <p className='text-neutral-1000 text-xs'>
                While active, your matching approvals route to the delegate and
                their decisions are recorded on your behalf — visible to your
                managers and hierarchy. Revoke at any time to route work back
                to you.
              </p>
            </div>
            <div className='border-gray-200 flex items-center justify-end gap-3 border-t px-5 py-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type='submit'>Create delegation</Button>
            </div>
          </form>
        </Form>
      </FloatingSheetContent>
    </Sheet>
  )
}
