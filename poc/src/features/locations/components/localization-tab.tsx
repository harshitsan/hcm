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
import {
  CURRENCIES,
  DATE_FORMATS,
  DISTANCE_UNITS,
  LOCALIZATION_COUNTRIES,
  PIN_CODE_FORMATS,
} from '../data/organization'
import type { OrganizationStore } from '../hooks/use-organization'
import { formatDate, todayISO } from '../utils/format'

const localizationSchema = z.object({
  country: z.enum(LOCALIZATION_COUNTRIES),
  dateFormat: z.enum(DATE_FORMATS),
  currencyId: z.string().min(1, 'Select a currency'),
  distanceUnit: z.enum(DISTANCE_UNITS),
  pinCodeFormatId: z.string().min(1, 'Select a pin code format'),
})

type LocalizationValues = z.infer<typeof localizationSchema>

interface LocalizationTabProps {
  org: OrganizationStore
}

/**
 * Localization settings (LOC-26..29): country + date format, currency symbol
 * and format, distance unit and the pin code format used for address
 * validation across the module. A live preview shows each choice applied.
 */
export function LocalizationTab({ org }: LocalizationTabProps) {
  const form = useForm<LocalizationValues>({
    resolver: zodResolver(localizationSchema),
    defaultValues: org.localization,
  })

  const watched = form.watch()
  const previewCurrency =
    CURRENCIES.find((c) => c.id === watched.currencyId) ?? CURRENCIES[0]
  const previewPin =
    PIN_CODE_FORMATS.find((f) => f.id === watched.pinCodeFormatId) ??
    PIN_CODE_FORMATS[0]

  function handleSubmit(values: LocalizationValues) {
    org.saveLocalization(values)
  }

  return (
    <div className='grid w-full gap-4 lg:grid-cols-2'>
      <Card className='gap-2 border-none bg-white py-3'>
        <CardHeader className='px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Localization settings
          </CardTitle>
        </CardHeader>
        <CardContent className='px-4'>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-4'>
              <FormField
                control={form.control}
                name='country'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LOCALIZATION_COUNTRIES.map((c) => (
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
                name='dateFormat'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date format</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue placeholder='Choose a date format' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DATE_FORMATS.map((f) => (
                          <SelectItem key={f} value={f}>
                            {f} — e.g. {formatDate(todayISO(), f)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Applied everywhere dates are rendered in this module.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='currencyId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country / currency symbol</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CURRENCIES.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.label}
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
                name='distanceUnit'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Distance unit</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DISTANCE_UNITS.map((u) => (
                          <SelectItem key={u} value={u}>
                            {u}
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
                name='pinCodeFormatId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pin code format</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PIN_CODE_FORMATS.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.label} ({f.hint})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Address forms validate pin codes against this format.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='flex justify-end pt-2'>
                <Button type='submit'>Save</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className='h-fit gap-2 border-none bg-white py-3'>
        <CardHeader className='px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Live preview
          </CardTitle>
        </CardHeader>
        <CardContent className='px-4'>
          <dl className='space-y-3'>
            <div>
              <dt className='text-paragraph-sm text-neutral-1000'>Today’s date</dt>
              <dd className='text-neutral-1600 text-sm font-medium'>
                {formatDate(todayISO(), watched.dateFormat)}
              </dd>
            </div>
            <div>
              <dt className='text-paragraph-sm text-neutral-1000'>
                Amount in numbers
              </dt>
              <dd className='text-neutral-1600 text-sm font-medium'>
                {previewCurrency.sampleNumber}
              </dd>
            </div>
            <div>
              <dt className='text-paragraph-sm text-neutral-1000'>Amount in words</dt>
              <dd className='text-neutral-1600 text-sm font-medium'>
                {previewCurrency.sampleWords}
              </dd>
            </div>
            <div>
              <dt className='text-paragraph-sm text-neutral-1000'>Distance</dt>
              <dd className='text-neutral-1600 text-sm font-medium'>
                12.4 {watched.distanceUnit === 'Miles' ? 'mi' : 'km'} (
                {watched.distanceUnit})
              </dd>
            </div>
            <div>
              <dt className='text-paragraph-sm text-neutral-1000'>Pin code</dt>
              <dd className='text-neutral-1600 text-sm font-medium'>
                {previewPin.label} — {previewPin.hint}
              </dd>
            </div>
          </dl>
          <p className='text-paragraph-sm text-neutral-1000 mt-4'>
            Unsaved selections preview immediately; click Save to apply them
            across the application.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
