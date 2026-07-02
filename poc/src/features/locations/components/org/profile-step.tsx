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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CURRENT_COMPANY_ID } from '../../data/locations'
import { INDUSTRY_TYPES, ORG_TYPES } from '../../data/organization'
import type { LocationsStore } from '../../hooks/use-locations'
import type { OrganizationStore } from '../../hooks/use-organization'
import type { StepNavProps } from '../organization-tab'

const profileSchema = z.object({
  name: z.string().min(2, 'Organization name is required'),
  orgType: z.enum(ORG_TYPES),
  industryType: z.enum(INDUSTRY_TYPES),
  incorporationDate: z.string().min(10, 'Incorporation date is required'),
  prefix: z.string().min(2, 'Prefix is required').max(5, 'Max 5 characters'),
  primaryLocationId: z.string().min(1, 'Select the primary location'),
})

type ProfileValues = z.infer<typeof profileSchema>

interface ProfileStepProps extends StepNavProps {
  org: OrganizationStore
  store: LocationsStore
}

/** Head office legal profile tied to a primary location (LOC-19, LOC-25). */
export function ProfileStep({ org, store, onNext }: ProfileStepProps) {
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: org.profile,
  })

  // Only locations available to the admin's company can be chosen (LOC-19).
  const selectableLocations = store.visibleTo(CURRENT_COMPANY_ID)

  function handleSubmit(values: ProfileValues) {
    org.saveProfile(values)
    onNext()
  }

  return (
    <Card className='gap-2 border-none bg-white py-3'>
      <CardHeader className='px-4'>
        <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
          Head office profile
        </CardTitle>
      </CardHeader>
      <CardContent className='px-4'>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className='max-w-2xl space-y-4'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization name</FormLabel>
                  <FormControl>
                    <Input placeholder='Orion Retail India Pvt Ltd' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-2 gap-3'>
              <FormField
                control={form.control}
                name='orgType'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ORG_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
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
                name='industryType'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {INDUSTRY_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <FormField
                control={form.control}
                name='incorporationDate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Incorporation date</FormLabel>
                    <FormControl>
                      <Input type='date' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='prefix'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prefix</FormLabel>
                    <FormControl>
                      <Input placeholder='ORI' {...field} />
                    </FormControl>
                    <FormDescription>Used on employee/document ids</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='primaryLocationId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary location</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger variant='secondary' className='w-full'>
                        <SelectValue placeholder='Select a location' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {selectableLocations.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.name} ({l.acronym})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Only locations available to your company are listed.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='flex justify-end gap-3 pt-2'>
              <Button type='submit'>Save &amp; Next</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
