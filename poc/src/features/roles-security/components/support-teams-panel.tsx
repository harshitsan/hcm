import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
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
  APP_MODULES,
  LOCATIONS,
  PEOPLE,
  personName,
} from '../data/directory'
import { type SecurityConfigStore } from '../hooks/use-security-config'

const teamSchema = z
  .object({
    name: z.string().min(2, 'Team name is required'),
    locations: z.array(z.string()).min(1, 'Pick at least one location'),
    modules: z.array(z.enum(APP_MODULES)).min(1, 'Pick at least one module'),
    contactType: z.enum(['Functional', 'Technical']),
    primaryContactId: z.string().min(1, 'Primary contact is required'),
    secondaryContactId: z.string().min(1, 'Secondary contact is required'),
  })
  .refine((v) => v.primaryContactId !== v.secondaryContactId, {
    message: 'Secondary contact must differ from the primary',
    path: ['secondaryContactId'],
  })

type TeamValues = z.infer<typeof teamSchema>

/**
 * Support teams (RSEC-39): primary and secondary contacts mapped to
 * locations and modules so employees know whom to reach per site/function.
 */
export function SupportTeamsPanel({ store }: { store: SecurityConfigStore }) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const form = useForm<TeamValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: '',
      locations: [],
      modules: [],
      contactType: 'Functional',
      primaryContactId: '',
      secondaryContactId: '',
    },
  })

  const users = PEOPLE.filter((p) => p.isUser)

  const submit = (values: TeamValues) => {
    store.addSupportTeam(values)
    setDialogOpen(false)
    form.reset()
  }

  return (
    <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
      <div className='mb-3 flex items-center justify-between'>
        <h3 className='text-neutral-1600 text-sm font-medium'>
          Support Teams
          <span className='text-neutral-1000 ml-2 text-xs'>
            one team can cover several sites and functions
          </span>
        </h3>
        <Button className='h-7' onClick={() => setDialogOpen(true)}>
          New Support Team
        </Button>
      </div>
      <table className='w-full text-sm'>
        <thead>
          <tr className='text-neutral-1000 border-b text-left text-xs'>
            <th className='py-2 pr-3 font-medium'>Team</th>
            <th className='px-2 font-medium'>Locations</th>
            <th className='px-2 font-medium'>Modules</th>
            <th className='px-2 font-medium'>Contact type</th>
            <th className='px-2 font-medium'>Primary contact</th>
            <th className='px-2 font-medium'>Secondary contact</th>
          </tr>
        </thead>
        <tbody>
          {store.supportTeams.map((t) => (
            <tr key={t.id} className='border-b last:border-0'>
              <td className='text-neutral-1600 py-2 pr-3 font-medium'>
                {t.name}
              </td>
              <td className='text-neutral-1900 px-2'>
                {t.locations.join(', ')}
              </td>
              <td className='text-neutral-1900 px-2'>{t.modules.join(', ')}</td>
              <td className='text-neutral-1900 px-2'>{t.contactType}</td>
              <td className='text-neutral-1900 px-2'>
                {personName(t.primaryContactId)}
              </td>
              <td className='text-neutral-1900 px-2'>
                {personName(t.secondaryContactId)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-[480px]'>
          <DialogHeader>
            <DialogTitle>New support team</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(submit)} className='space-y-4'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team name</FormLabel>
                    <FormControl>
                      <Input placeholder='HR Helpdesk — South' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='locations'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Locations</FormLabel>
                    <div className='grid grid-cols-2 gap-2 rounded-[6px] border border-gray-200 p-3'>
                      {LOCATIONS.map((loc) => (
                        <label key={loc} className='flex items-center gap-2 text-sm'>
                          <Checkbox
                            variant='blue'
                            checked={field.value.includes(loc)}
                            onCheckedChange={(checked) =>
                              field.onChange(
                                checked
                                  ? [...field.value, loc]
                                  : field.value.filter((v) => v !== loc)
                              )
                            }
                          />
                          {loc}
                        </label>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='modules'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modules</FormLabel>
                    <div className='grid grid-cols-2 gap-2 rounded-[6px] border border-gray-200 p-3'>
                      {APP_MODULES.map((m) => (
                        <label key={m} className='flex items-center gap-2 text-sm'>
                          <Checkbox
                            variant='blue'
                            checked={field.value.includes(m)}
                            onCheckedChange={(checked) =>
                              field.onChange(
                                checked
                                  ? [...field.value, m]
                                  : field.value.filter((v) => v !== m)
                              )
                            }
                          />
                          {m}
                        </label>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='contactType'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='Functional'>Functional</SelectItem>
                        <SelectItem value='Technical'>Technical</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className='grid grid-cols-2 gap-3'>
                {(['primaryContactId', 'secondaryContactId'] as const).map(
                  (name) => (
                    <FormField
                      key={name}
                      control={form.control}
                      name={name}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {name === 'primaryContactId'
                              ? 'Primary contact'
                              : 'Secondary contact'}
                          </FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger
                                variant='secondary'
                                className='w-full'
                              >
                                <SelectValue placeholder='Select' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {users.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )
                )}
              </div>
              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type='submit'>Add team</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
