import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
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
import { type RetentionPolicyVersion } from '../data/audit-config'
import { type RetentionPolicyDraft } from '../hooks/use-audit-config'

const retentionSchema = z
  .object({
    activeMonths: z
      .string()
      .regex(/^\d+$/, 'Enter the active window as whole months'),
    totalYears: z
      .string()
      .regex(/^\d+$/, 'Enter total retention as whole years'),
    effectiveFrom: z.string().min(1, 'Effective date is required'),
  })
  .superRefine((values, ctx) => {
    const activeMonths = Number(values.activeMonths)
    const totalYears = Number(values.totalYears)
    if (activeMonths < 1 || activeMonths > 60) {
      ctx.addIssue({
        code: 'custom',
        path: ['activeMonths'],
        message: 'Active window must be between 1 and 60 months',
      })
    }
    if (totalYears < 1 || totalYears > 15) {
      ctx.addIssue({
        code: 'custom',
        path: ['totalYears'],
        message: 'Total retention must be between 1 and 15 years',
      })
    }
    if (totalYears * 12 < activeMonths) {
      ctx.addIssue({
        code: 'custom',
        path: ['totalYears'],
        message: 'Total retention cannot be shorter than the active window',
      })
    }
  })

type RetentionFormValues = z.infer<typeof retentionSchema>

interface RetentionPolicyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  current: RetentionPolicyVersion
  onSubmit: (draft: RetentionPolicyDraft) => void
}

/**
 * Governed, versioned, effective-dated retention configuration (FR 6.29.3).
 * Saving creates a new policy version — no code deployment involved — and an
 * invalid policy (total shorter than active window) is rejected.
 */
export function RetentionPolicyDialog({
  open,
  onOpenChange,
  current,
  onSubmit,
}: RetentionPolicyDialogProps) {
  const form = useForm<RetentionFormValues>({
    resolver: zodResolver(retentionSchema),
    defaultValues: {
      activeMonths: String(current.activeMonths),
      totalYears: String(current.totalYears),
      effectiveFrom: new Date().toISOString().slice(0, 10),
    },
  })

  useEffect(() => {
    if (!open) return
    form.reset({
      activeMonths: String(current.activeMonths),
      totalYears: String(current.totalYears),
      effectiveFrom: new Date().toISOString().slice(0, 10),
    })
  }, [open, current, form])

  function handleSubmit(values: RetentionFormValues) {
    onSubmit({
      activeMonths: Number(values.activeMonths),
      totalYears: Number(values.totalYears),
      effectiveFrom: values.effectiveFrom,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[440px]'>
        <DialogHeader>
          <DialogTitle>Edit retention policy</DialogTitle>
          <DialogDescription>
            Creates policy v{current.version + 1} as versioned, effective-dated
            configuration. The archival and disposal processes read the
            currently effective values — prior versions remain auditable.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className='space-y-4'
          >
            <FormField
              control={form.control}
              name='activeMonths'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Active retention window (months)</FormLabel>
                  <FormControl>
                    <Input inputMode='numeric' placeholder='12' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='totalYears'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total retention incl. archival (years)</FormLabel>
                  <FormControl>
                    <Input inputMode='numeric' placeholder='7' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='effectiveFrom'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Effective from</FormLabel>
                  <FormControl>
                    <Input type='date' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type='submit'>Save policy version</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
