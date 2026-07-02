import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import type { RegisteredContact } from '../../data/organization'
import type { OrganizationStore } from '../../hooks/use-organization'
import type { StepNavProps } from '../organization-tab'

interface AddressStepProps extends StepNavProps {
  org: OrganizationStore
}

type FieldName = keyof RegisteredContact

/** Registered address + contact details for official communications (LOC-22). */
export function AddressStep({ org, onNext, onBack }: AddressStepProps) {
  const addressSchema = z.object({
    address1: z.string().min(3, 'Address 1 is required'),
    address2: z.string(),
    city: z.string().min(2, 'City is required'),
    country: z.string().min(2, 'Country is required'),
    state: z.string().min(2, 'State is required'),
    pinCode: z
      .string()
      .min(1, 'Pin code is required')
      .refine((v) => org.validatePinCode(v), {
        message: `Pin code must match the configured format (${org.pinCodeFormat.label}, ${org.pinCodeFormat.hint})`,
      }),
    phone1: z.string().min(6, 'Phone 1 is required'),
    phone2: z.string(),
    fax: z.string(),
    email: z.email('Enter a valid email'),
  })

  const form = useForm<RegisteredContact>({
    resolver: zodResolver(addressSchema),
    defaultValues: org.contact,
  })

  function handleSubmit(values: RegisteredContact) {
    org.saveContact(values)
    onNext()
  }

  const field = (name: FieldName, label: string, placeholder = '') => (
    <FormField
      control={form.control}
      name={name}
      render={({ field: f }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input placeholder={placeholder} {...f} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )

  return (
    <Card className='gap-2 border-none bg-white py-3'>
      <CardHeader className='px-4'>
        <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
          Registered address &amp; contact details
        </CardTitle>
      </CardHeader>
      <CardContent className='px-4'>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className='max-w-2xl space-y-4'>
            {field('address1', 'Address 1', 'Street / building')}
            {field('address2', 'Address 2 (optional)', 'Area / landmark')}
            <div className='grid grid-cols-2 gap-3'>
              {field('city', 'City')}
              {field('country', 'Country')}
            </div>
            <div className='grid grid-cols-2 gap-3'>
              {field('state', 'State')}
              {field('pinCode', `Pin code (${org.pinCodeFormat.label})`, org.pinCodeFormat.hint.replace('e.g. ', ''))}
            </div>
            <div className='grid grid-cols-2 gap-3'>
              {field('phone1', 'Phone 1', '+91 80 ...')}
              {field('phone2', 'Phone 2 (optional)')}
            </div>
            <div className='grid grid-cols-2 gap-3'>
              {field('fax', 'Fax (optional)')}
              {field('email', 'Email', 'corporate@company.com')}
            </div>

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
