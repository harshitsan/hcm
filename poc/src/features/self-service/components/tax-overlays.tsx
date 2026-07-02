import { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Form } from '@/components/ui/form'
import {
  DEDUCTION_CATEGORIES,
  FINANCIAL_YEARS,
  LTA_RELATIONSHIPS,
  TRAVEL_MODES,
  type FinancialYear,
} from '../data/tax'
import { type DeductionDraft, type LtaClaimDraft } from '../hooks/use-tax'
import { SelectField, TextField } from './form-fields'

const deductionSchema = z.object({
  financialYear: z.enum(FINANCIAL_YEARS),
  name: z.string().min(3, 'Name the deduction'),
  category: z.enum(DEDUCTION_CATEGORIES),
  providerName: z.string().min(2, 'Insurer / bank name is required'),
  referenceNumber: z.string().min(3, 'Policy / loan number is required'),
  amount: z.number().min(1, 'Amount must be positive'),
  paymentDate: z.string().min(1, 'Payment date is required'),
})

interface DeductionOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  financialYear: FinancialYear
  onSubmit: (draft: DeductionDraft) => void
}

/** Declare a tax deduction for the selected financial year (ESS-33). */
export function DeductionOverlay({
  open,
  onOpenChange,
  financialYear,
  onSubmit,
}: DeductionOverlayProps) {
  const form = useForm<z.infer<typeof deductionSchema>>({
    resolver: zodResolver(deductionSchema),
    defaultValues: {
      financialYear,
      name: '',
      category: DEDUCTION_CATEGORIES[0],
      providerName: '',
      referenceNumber: '',
      amount: 0,
      paymentDate: '',
    },
  })

  useEffect(() => {
    if (open)
      form.reset({
        financialYear,
        name: '',
        category: DEDUCTION_CATEGORIES[0],
        providerName: '',
        referenceNumber: '',
        amount: 0,
        paymentDate: '',
      })
  }, [open, financialYear, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[460px]'>
        <DialogHeader>
          <DialogTitle>Declare deduction</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => {
              onSubmit({ ...values, actualPaymentDate: null })
              onOpenChange(false)
            })}
            className='space-y-3'
          >
            <SelectField
              control={form.control}
              name='financialYear'
              label='Financial year'
              options={FINANCIAL_YEARS}
            />
            <TextField control={form.control} name='name' label='Deduction name' />
            <SelectField
              control={form.control}
              name='category'
              label='Category'
              options={DEDUCTION_CATEGORIES}
            />
            <div className='grid grid-cols-2 gap-3'>
              <TextField
                control={form.control}
                name='providerName'
                label='Insurer / bank'
              />
              <TextField
                control={form.control}
                name='referenceNumber'
                label='Policy / loan #'
              />
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <TextField
                control={form.control}
                name='amount'
                label='Amount (₹)'
                type='number'
              />
              <TextField
                control={form.control}
                name='paymentDate'
                label='Payment date'
                type='date'
              />
            </div>
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type='submit'>Save declaration</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

const ltaSchema = z
  .object({
    financialYear: z.enum(FINANCIAL_YEARS),
    relationship: z.enum(LTA_RELATIONSHIPS),
    travellerName: z.string().min(2, 'Traveller name is required'),
    departureDate: z.string().min(1, 'Departure date is required'),
    arrivalDate: z.string().min(1, 'Arrival date is required'),
    modeOfTravel: z.enum(TRAVEL_MODES),
    totalAmount: z.number().min(1, 'Amount must be positive'),
    claimFrom: z.string().min(1, 'Claim period from is required'),
    claimTo: z.string().min(1, 'Claim period to is required'),
  })
  .refine((v) => v.arrivalDate >= v.departureDate, {
    message: 'Arrival must be on or after departure',
    path: ['arrivalDate'],
  })

interface LtaOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  financialYear: FinancialYear
  onSubmit: (draft: LtaClaimDraft) => void
}

/** New LTA reimbursement claim with travel details (ESS-35). */
export function LtaOverlay({
  open,
  onOpenChange,
  financialYear,
  onSubmit,
}: LtaOverlayProps) {
  const form = useForm<z.infer<typeof ltaSchema>>({
    resolver: zodResolver(ltaSchema),
    defaultValues: {
      financialYear,
      relationship: 'Self',
      travellerName: '',
      departureDate: '',
      arrivalDate: '',
      modeOfTravel: 'Air',
      totalAmount: 0,
      claimFrom: '',
      claimTo: '',
    },
  })

  useEffect(() => {
    if (open)
      form.reset({
        financialYear,
        relationship: 'Self',
        travellerName: '',
        departureDate: '',
        arrivalDate: '',
        modeOfTravel: 'Air',
        totalAmount: 0,
        claimFrom: '',
        claimTo: '',
      })
  }, [open, financialYear, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[480px]'>
        <DialogHeader>
          <DialogTitle>New LTA reimbursement claim</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => {
              onSubmit(values)
              onOpenChange(false)
            })}
            className='space-y-3'
          >
            <div className='grid grid-cols-2 gap-3'>
              <SelectField
                control={form.control}
                name='financialYear'
                label='Financial year'
                options={FINANCIAL_YEARS}
              />
              <SelectField
                control={form.control}
                name='relationship'
                label='Relationship'
                options={LTA_RELATIONSHIPS}
              />
            </div>
            <TextField
              control={form.control}
              name='travellerName'
              label='Traveller name'
            />
            <div className='grid grid-cols-2 gap-3'>
              <TextField
                control={form.control}
                name='departureDate'
                label='Date of departure'
                type='date'
              />
              <TextField
                control={form.control}
                name='arrivalDate'
                label='Date of arrival'
                type='date'
              />
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <SelectField
                control={form.control}
                name='modeOfTravel'
                label='Mode of travel'
                options={TRAVEL_MODES}
              />
              <TextField
                control={form.control}
                name='totalAmount'
                label='Total amount (₹)'
                type='number'
              />
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <TextField
                control={form.control}
                name='claimFrom'
                label='Claim period from'
                type='date'
              />
              <TextField
                control={form.control}
                name='claimTo'
                label='Claim period to'
                type='date'
              />
            </div>
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type='submit'>Save claim</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
