import { useEffect, useMemo } from 'react'
import { z } from 'zod'
import { useForm, type UseFormReturn, type FieldValues, type Path } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { type AssetCategoryConfig } from '../data/config'
import { type ArrivalDraft, type OutboundDraft } from '../hooks/use-movements'

function CategoryField<T extends FieldValues>({
  form,
  categories,
}: {
  form: UseFormReturn<T>
  categories: AssetCategoryConfig[]
}) {
  return (
    <FormField
      control={form.control}
      name={'category' as Path<T>}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Asset category</FormLabel>
          <Select value={field.value as string} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger variant='secondary' className='w-full'>
                <SelectValue placeholder='Select category' />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {categories
                .filter((c) => c.active)
                .map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

interface ArrivalFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: AssetCategoryConfig[]
  onSubmit: (draft: ArrivalDraft) => void
}

/** Record asset inward details with full procurement provenance (ASM-32). */
export function ArrivalFormDialog({ open, onOpenChange, categories, onSubmit }: ArrivalFormDialogProps) {
  const schema = useMemo(
    () =>
      z.object({
        category: z.string().min(1, 'Category is required'),
        name: z.string().min(2, 'Asset name is required'),
        vendor: z.string().min(2, 'Vendor is required'),
        procuredDate: z.string().min(1, 'Procured date is required'),
        invoiceNumber: z.string().min(2, 'Invoice number is required'),
        approvedQuantity: z.coerce.number<number>().int().min(1, 'Quantity must be at least 1'),
        totalValue: z.coerce.number<number>().min(1, 'Total asset value is required'),
      }),
    []
  )
  type Values = z.infer<typeof schema>
  const empty: Values = {
    category: '',
    name: '',
    vendor: '',
    procuredDate: '',
    invoiceNumber: '',
    approvedQuantity: 1,
    totalValue: 0,
  }
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: empty })

  useEffect(() => {
    if (open) form.reset(empty)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[460px]'>
        <DialogHeader>
          <DialogTitle>Add asset inward details</DialogTitle>
          <DialogDescription>
            The arrival starts as Pending Approval — approved units are then admitted to
            inventory as Available.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => { onSubmit(v); onOpenChange(false) })} className='space-y-3'>
            <CategoryField form={form} categories={categories} />
            <div className='grid grid-cols-2 gap-3'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset name</FormLabel>
                    <FormControl>
                      <Input placeholder='iPad Pro 12.9"' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='vendor'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor</FormLabel>
                    <FormControl>
                      <Input placeholder='Redington' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <FormField
                control={form.control}
                name='procuredDate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Procured date</FormLabel>
                    <FormControl>
                      <Input type='date' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='invoiceNumber'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice number</FormLabel>
                    <FormControl>
                      <Input placeholder='e.g. INV-2110' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <FormField
                control={form.control}
                name='approvedQuantity'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Approved quantity</FormLabel>
                    <FormControl>
                      <Input type='number' min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='totalValue'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total asset value (INR)</FormLabel>
                    <FormControl>
                      <Input type='number' min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type='submit'>Record arrival</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

interface OutboundFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: AssetCategoryConfig[]
  onSubmit: (draft: OutboundDraft) => void
}

/** Raise an outbound asset record with a security gate pass (ASM-34). */
export function OutboundFormDialog({ open, onOpenChange, categories, onSubmit }: OutboundFormDialogProps) {
  const schema = useMemo(
    () =>
      z.object({
        category: z.string().min(1, 'Category is required'),
        name: z.string().min(2, 'Asset name is required'),
        vendor: z.string().min(1, 'Vendor / destination is required'),
        passNumber: z.string().min(2, 'Security pass number is required'),
        passDate: z.string().min(1, 'Security pass date is required'),
        reason: z.string().min(3, 'Reason for outbound movement is required'),
      }),
    []
  )
  type Values = z.infer<typeof schema>
  const empty: Values = { category: '', name: '', vendor: '', passNumber: '', passDate: '', reason: '' }
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: empty })

  useEffect(() => {
    if (open) form.reset(empty)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[460px]'>
        <DialogHeader>
          <DialogTitle>New outbound asset record</DialogTitle>
          <DialogDescription>
            Assets leave the premises only after approval — the security pass validates
            authorised removal at the gate.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => { onSubmit(v); onOpenChange(false) })} className='space-y-3'>
            <CategoryField form={form} categories={categories} />
            <div className='grid grid-cols-2 gap-3'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset name</FormLabel>
                    <FormControl>
                      <Input placeholder='Cisco Catalyst Switch' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='vendor'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor / destination</FormLabel>
                    <FormControl>
                      <Input placeholder='Service centre' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <FormField
                control={form.control}
                name='passNumber'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Security pass number</FormLabel>
                    <FormControl>
                      <Input placeholder='e.g. GP-2026-140' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='passDate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Security pass date</FormLabel>
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
              name='reason'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Input placeholder='Repair / disposal / off-site use…' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type='submit'>Create record</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
