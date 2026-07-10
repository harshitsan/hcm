import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash, UserGear } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { MultiSelectDropdown } from '@/components/ui/multi-select-dropdown'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  COORDINATOR_ROLE_TYPES,
  seedEmployees,
  type OrgConfig,
} from '../data/org'
import {
  type AnnouncementSettingsStore,
  type CoordinatorDraft,
} from '../hooks/use-announcement-settings'

const coordinatorSchema = z.object({
  roleName: z.string().min(3, 'Role name is required'),
  roleType: z.enum(COORDINATOR_ROLE_TYPES),
  description: z.string(),
  locations: z.array(z.string()),
  departments: z.array(z.string()),
  positions: z.array(z.string()),
  employee: z.string().min(1, 'Select the employee to assign the role to'),
})

type CoordinatorFormValues = z.infer<typeof coordinatorSchema>

const emptyCoordinator: CoordinatorFormValues = {
  roleName: '',
  roleType: 'Announcement Coordinator',
  description: '',
  locations: [],
  departments: [],
  positions: [],
  employee: '',
}

interface CoordinatorsCardProps {
  settings: AnnouncementSettingsStore
  orgConfig: OrgConfig
}

/**
 * Announcement Coordinator role (PDF: Announcement Coordinator Role):
 * lightweight in-memory assignment of the coordinator/reviewer role — role
 * name + type, description, and the applicable location(s)/department(s)/
 * position(s) the coordinator is responsible for, assigned to an employee.
 */
export function CoordinatorsCard({ settings, orgConfig }: CoordinatorsCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  const form = useForm<CoordinatorFormValues>({
    resolver: zodResolver(coordinatorSchema),
    defaultValues: emptyCoordinator,
  })

  useEffect(() => {
    if (dialogOpen) form.reset(emptyCoordinator)
  }, [dialogOpen, form])

  const optionsFor = (dimension: 'locations' | 'departments' | 'positions') =>
    orgConfig[dimension]
      .filter((v) => !v.deprecated)
      .map((v) => ({ id: v.value, label: v.value }))

  const handleSubmit = (values: CoordinatorFormValues) => {
    const draft: CoordinatorDraft = values
    settings.addCoordinator(draft)
    setDialogOpen(false)
  }

  return (
    <div className='w-full'>
      <div className='mb-3 flex items-center justify-between'>
        <div>
          <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
            Announcement Coordinator roles ({settings.coordinators.length})
          </h2>
          <p className='text-paragraph-sm text-neutral-1000'>
            Coordinators create, publish and review announcements and maintain
            the announcement image repository for their applicable scope.
          </p>
        </div>
        <Button
          variant='red'
          onClick={() => setDialogOpen(true)}
          className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
        >
          <Plus size={10} weight='bold' />
          Add/Edit new Role
        </Button>
      </div>

      <div className='grid grid-cols-1 gap-3 lg:grid-cols-2'>
        {settings.coordinators.map((c) => (
          <div
            key={c.id}
            className='rounded-[8px] border border-gray-200 bg-white px-4 py-3'
          >
            <div className='flex items-start justify-between gap-2'>
              <div className='flex items-center gap-2'>
                <div className='bg-blue-150 flex size-8 items-center justify-center rounded-[6px]'>
                  <UserGear size={16} className='text-blue-1400' />
                </div>
                <div>
                  <p className='text-neutral-1600 text-sm font-medium'>
                    {c.roleName}
                  </p>
                  <p className='text-paragraph-sm text-neutral-1000'>
                    {c.roleType} · Assigned to {c.employee}
                  </p>
                </div>
              </div>
              <Button
                variant='icon2'
                className='text-neutral-1900 h-7 w-7'
                aria-label={`Remove ${c.roleName}`}
                onClick={() => settings.removeCoordinator(c.id)}
              >
                <Trash size={14} weight='bold' />
              </Button>
            </div>
            {c.description && (
              <p className='text-paragraph-sm text-neutral-1000 mt-2'>
                {c.description}
              </p>
            )}
            <div className='mt-2 flex flex-wrap gap-1.5'>
              {c.locations.map((loc) => (
                <Badge key={`loc-${loc}`} variant='open'>
                  {loc}
                </Badge>
              ))}
              {c.departments.map((dept) => (
                <Badge key={`dept-${dept}`} variant='booked'>
                  {dept}
                </Badge>
              ))}
              {c.positions.map((pos) => (
                <Badge key={`pos-${pos}`} variant='pending'>
                  {pos}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-[480px]'>
          <DialogHeader>
            <DialogTitle>Add/Edit new Role</DialogTitle>
            <DialogDescription>
              Assign the Announcement Coordinator role with its applicable
              location(s), department(s) and position(s).
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-4'>
              <FormField
                control={form.control}
                name='roleName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role name</FormLabel>
                    <FormControl>
                      <Input placeholder='India Announcement Coordinator' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='roleType'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COORDINATOR_ROLE_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
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
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Describe the responsibilities of this role…'
                        className='min-h-16'
                        {...field}
                      />
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
                    <FormLabel>Applicable location(s)</FormLabel>
                    <MultiSelectDropdown
                      items={optionsFor('locations')}
                      selectedIds={field.value}
                      onSelectionChange={field.onChange}
                      placeholder='Any location'
                      className='w-full'
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='departments'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Applicable department(s)</FormLabel>
                    <MultiSelectDropdown
                      items={optionsFor('departments')}
                      selectedIds={field.value}
                      onSelectionChange={field.onChange}
                      placeholder='Any department'
                      className='w-full'
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='positions'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Applicable position(s)</FormLabel>
                    <MultiSelectDropdown
                      items={optionsFor('positions')}
                      selectedIds={field.value}
                      onSelectionChange={field.onChange}
                      placeholder='Any position'
                      className='w-full'
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='employee'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Applicable employee</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue placeholder='Select employee' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {seedEmployees
                          .filter((e) => e.hasSystemAccess)
                          .map((e) => (
                            <SelectItem key={e.id} value={e.name}>
                              {e.name} — {e.position}, {e.location}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className='flex items-center justify-end gap-3'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type='submit'>Save</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
