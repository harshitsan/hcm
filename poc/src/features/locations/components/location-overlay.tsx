import { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import {
  Form,
  FormControl,
  FormDescription,
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
import {
  JURISDICTIONS,
  LOCATION_STATUSES,
  TIMEZONES,
  type CompanyLocation,
} from '../data/locations'
import type { PinCodeFormat } from '../data/organization'
import type { LocationDraft } from '../hooks/use-locations'

const IP_PATTERN = /^\d{1,3}(\.\d{1,3}){3}(\/\d{1,2})?$/

interface LocationOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When set, the sheet edits this location; otherwise it creates a new one. */
  location?: CompanyLocation | null
  onSubmit: (draft: LocationDraft) => void
  /** Pin codes are validated against the localization-configured format (LOC-29). */
  pinCodeFormat: PinCodeFormat
}

export function LocationOverlay({
  open,
  onOpenChange,
  location,
  onSubmit,
  pinCodeFormat,
}: LocationOverlayProps) {
  const isEdit = Boolean(location)

  const locationFormSchema = z.object({
    name: z.string().min(2, 'Location name is required'),
    acronym: z
      .string()
      .min(2, 'Acronym is required')
      .max(8, 'Keep the acronym to 8 characters'),
    // A Select yields exactly one value — a location belongs to exactly one
    // jurisdiction (LOC-01); an empty value blocks the save.
    jurisdictionId: z.string().min(1, 'Select exactly one jurisdiction'),
    timezone: z.string().min(1, 'Timezone is required'),
    ipAddress: z
      .string()
      .regex(IP_PATTERN, 'Enter an IPv4 address or CIDR range (e.g. 10.10.1.0/24)'),
    address1: z.string().min(3, 'Address is required'),
    address2: z.string(),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State is required'),
    country: z.string().min(2, 'Country is required'),
    pinCode: z
      .string()
      .min(1, 'Pin code is required')
      .refine((v) => new RegExp(pinCodeFormat.pattern).test(v), {
        message: `Pin code must match the configured format: ${pinCodeFormat.label} (${pinCodeFormat.hint})`,
      }),
    status: z.enum(LOCATION_STATUSES),
  })

  type LocationFormValues = z.infer<typeof locationFormSchema>

  const emptyDraft: LocationFormValues = {
    name: '',
    acronym: '',
    jurisdictionId: '',
    timezone: 'Asia/Kolkata',
    ipAddress: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    country: '',
    pinCode: '',
    status: 'active',
  }

  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationFormSchema),
    defaultValues: emptyDraft,
  })

  useEffect(() => {
    if (!open) return
    form.reset(
      location
        ? {
            name: location.name,
            acronym: location.acronym,
            jurisdictionId: location.jurisdictionId,
            timezone: location.timezone,
            ipAddress: location.ipAddress,
            address1: location.address1,
            address2: location.address2,
            city: location.city,
            state: location.state,
            country: location.country,
            pinCode: location.pinCode,
            status: location.status,
          }
        : emptyDraft
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, location, form])

  function handleSubmit(values: LocationFormValues) {
    onSubmit(values)
    onOpenChange(false)
  }

  const textField = (
    name: 'name' | 'acronym' | 'ipAddress' | 'address1' | 'address2' | 'city' | 'state' | 'country' | 'pinCode',
    label: string,
    placeholder: string,
    description?: string
  ) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input placeholder={placeholder} {...field} />
          </FormControl>
          {description ? <FormDescription>{description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[520px]'>
        <SheetHeader className='border-grey-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            {isEdit ? 'Edit location' : 'New location'}
          </SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className='flex min-h-0 flex-1 flex-col'
          >
            <div className='flex-1 space-y-4 overflow-y-auto px-5 py-5'>
              {textField('name', 'Location name', 'Bengaluru Headquarters')}

              <div className='grid grid-cols-2 gap-3'>
                {textField('acronym', 'Acronym', 'BLR-HQ', 'Short unique site code')}
                <FormField
                  control={form.control}
                  name='timezone'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timezone</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger variant='secondary' className='w-full'>
                            <SelectValue placeholder='Select timezone' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TIMEZONES.map((tz) => (
                            <SelectItem key={tz} value={tz}>
                              {tz}
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
                name='jurisdictionId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jurisdiction</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue placeholder='Select exactly one jurisdiction' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {JURISDICTIONS.map((j) => (
                          <SelectItem key={j.id} value={j.id}>
                            {j.name} — {j.country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      A location belongs to exactly one jurisdiction. Several
                      locations may share the same jurisdiction.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {textField(
                'ipAddress',
                'IP address / range',
                '10.10.1.0/24',
                'Used for network-based site presence validation'
              )}

              <div className='border-grey-200 border-t pt-4'>
                <p className='text-paragraph-sm text-neutral-1600 mb-3 font-semibold'>
                  Postal address
                </p>
                <div className='space-y-4'>
                  {textField('address1', 'Address line 1', 'Street / building')}
                  {textField('address2', 'Address line 2 (optional)', 'Area / landmark')}
                  <div className='grid grid-cols-2 gap-3'>
                    {textField('city', 'City', 'Bengaluru')}
                    {textField('state', 'State', 'Karnataka')}
                  </div>
                  <div className='grid grid-cols-2 gap-3'>
                    {textField('country', 'Country', 'India')}
                    {textField(
                      'pinCode',
                      'Pin code',
                      pinCodeFormat.hint.replace('e.g. ', ''),
                      `Format: ${pinCodeFormat.label}`
                    )}
                  </div>
                </div>
              </div>

              <FormField
                control={form.control}
                name='status'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='active'>Active</SelectItem>
                        <SelectItem value='inactive'>Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                {isEdit ? 'Save changes' : 'Create location'}
              </Button>
            </div>
          </form>
        </Form>
      </FloatingSheetContent>
    </Sheet>
  )
}
